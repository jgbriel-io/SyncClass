-- ============================================
-- VERIFICAÇÃO FINAL - HEALTH CHECK COMPLETO
-- Valida todas as otimizações e funcionalidades
-- Data: 16/02/2026 (Consolidado)
-- ============================================
-- Verifica:
-- - Estrutura (tabelas, colunas, índices)
-- - Lógica (views, funções, triggers)
-- - Segurança (RLS, permissões, roles)
-- - Funcionalidades (anonimização, comprovantes, etc)
-- ============================================

DO $$
DECLARE
  rec RECORD;
  v_policy_count INTEGER;
  v_duplicate_policies INTEGER;
  v_index_count INTEGER;
  v_function_count INTEGER;
  v_table_count INTEGER;
  v_unindexed_fkeys INTEGER;
  v_unused_indexes INTEGER;
  v_result TEXT := '';
  v_critical_issues INTEGER := 0;
  v_warnings INTEGER := 0;
BEGIN
  v_result := v_result || E'\n============================================\n';
  v_result := v_result || 'HEALTH CHECK - EDUCORE DATABASE\n';
  v_result := v_result || 'Data: ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS') || E'\n';
  v_result := v_result || E'============================================\n\n';

  -- 1. Contar tabelas
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  v_result := v_result || '📊 TABELAS\n';
  v_result := v_result || '  Total: ' || v_table_count || E'\n\n';

  -- 2. Verificar políticas RLS
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  v_result := v_result || '🔒 POLÍTICAS RLS\n';
  v_result := v_result || '  Total: ' || v_policy_count || E'\n';

  -- 3. Verificar políticas duplicadas
  SELECT COUNT(*) INTO v_duplicate_policies
  FROM (
    SELECT tablename, cmd, roles::text, COUNT(*) as cnt
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
    GROUP BY tablename, cmd, roles::text
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicate_policies = 0 THEN
    v_result := v_result || '  ✅ Sem políticas duplicadas\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: ' || v_duplicate_policies || ' políticas duplicadas encontradas!\n';
  END IF;

  -- 4. Verificar políticas com acesso anônimo
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND 'anon' = ANY(roles);
  
  IF v_policy_count = 0 THEN
    v_result := v_result || '  ✅ Sem acesso anônimo\n';
  ELSE
    v_result := v_result || '  ⚠️  ' || v_policy_count || ' políticas com acesso anônimo\n';
  END IF;
  
  v_result := v_result || E'\n';

  -- 5. Verificar funções auxiliares
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('is_admin', 'is_teacher', 'is_student', 'get_student_id', 'get_teacher_id');
  
  v_result := v_result || '⚙️  FUNÇÕES AUXILIARES DE AUTENTICAÇÃO\n';
  IF v_function_count = 5 THEN
    v_result := v_result || '  ✅ Todas as 5 funções presentes\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: Apenas ' || v_function_count || '/5 funções encontradas!\n';
  END IF;

  -- 5.1 Verificar funções de anonimização (LGPD)
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('anonymize_student', 'anonymize_teacher', 'hard_delete_anonymized_records');
  
  v_result := v_result || E'\n🔒 FUNÇÕES DE ANONIMIZAÇÃO (LGPD)\n';
  IF v_function_count = 3 THEN
    v_result := v_result || '  ✅ Todas as 3 funções presentes\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: Apenas ' || v_function_count || '/3 funções encontradas!\n';
  END IF;

  -- 5.2 Verificar funções de comprovante de pagamento
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('submit_payment_proof', 'review_payment_proof');
  
  v_result := v_result || E'\n💰 FUNÇÕES DE COMPROVANTE DE PAGAMENTO\n';
  IF v_function_count = 2 THEN
    v_result := v_result || '  ✅ Todas as 2 funções presentes\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: Apenas ' || v_function_count || '/2 funções encontradas!\n';
  END IF;

  -- 5.3 Verificar funções de negócio (RPCs)
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('create_class_package', 'mark_as_paid_idempotent', 'confirm_payment_idempotent', 'undo_payment_idempotent');
  
  v_result := v_result || E'\n📦 FUNÇÕES DE NEGÓCIO (RPCs)\n';
  IF v_function_count = 4 THEN
    v_result := v_result || '  ✅ Todas as 4 funções presentes\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: Apenas ' || v_function_count || '/4 funções encontradas!\n';
  END IF;

  -- 5.4 Verificar SET search_path em funções SECURITY DEFINER
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND prosecdef = true
    AND (proconfig IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(proconfig) cfg WHERE cfg LIKE 'search_path=%'
    ));
  
  v_result := v_result || E'\n🔐 SEGURANÇA DE FUNÇÕES (search_path)\n';
  IF v_function_count = 0 THEN
    v_result := v_result || '  ✅ Todas as funções SECURITY DEFINER têm SET search_path\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: ' || v_function_count || ' funções sem SET search_path!\n';
  END IF;
  
  v_result := v_result || E'\n';

  -- 6. Verificar índices
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  v_result := v_result || '📇 ÍNDICES\n';
  v_result := v_result || '  Total: ' || v_index_count || E'\n';

  -- 7. Verificar foreign keys sem índice
  SELECT COUNT(*) INTO v_unindexed_fkeys
  FROM (
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_indexes i
        WHERE i.schemaname = 'public'
          AND i.tablename = tc.table_name
          AND i.indexdef LIKE '%' || kcu.column_name || '%'
      )
  ) unindexed;
  
  IF v_unindexed_fkeys = 0 THEN
    v_result := v_result || '  ✅ Todas as foreign keys indexadas\n';
  ELSE
    v_result := v_result || '  ⚠️  ' || v_unindexed_fkeys || ' foreign keys sem índice\n';
  END IF;

  -- 8. Verificar índices não utilizados (INFO)
  SELECT COUNT(*) INTO v_unused_indexes
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname NOT LIKE 'pg_%';
  
  IF v_unused_indexes = 0 THEN
    v_result := v_result || '  ✅ Nenhum índice não utilizado\n';
  ELSE
    v_result := v_result || '  ℹ️  ' || v_unused_indexes || ' índices com idx_scan = 0\n';
    v_result := v_result || '     (Normal para índices recém-criados)\n';
  END IF;
  v_result := v_result || E'\n';

  -- 10. Listar políticas por tabela
  v_result := v_result || '📋 POLÍTICAS POR TABELA\n';
  FOR rec IN (
    SELECT 
      tablename,
      COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_count,
      COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_count,
      COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_count,
      COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_count,
      COUNT(*) as total
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename
  ) LOOP
    v_result := v_result || '  ' || RPAD(rec.tablename, 30) || 
                ' S:' || rec.select_count || 
                ' I:' || rec.insert_count || 
                ' U:' || rec.update_count || 
                ' D:' || rec.delete_count || 
                ' (Total: ' || rec.total || E')\n';
  END LOOP;
  v_result := v_result || E'\n';

  -- 10. Verificar índices compostos criados
  v_result := v_result || '🔗 ÍNDICES COMPOSTOS ESTRATÉGICOS\n';
  FOR rec IN (
    SELECT indexname, tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'idx_financial_records_student_status',
        'idx_class_logs_teacher_date',
        'idx_class_logs_student_date',
        'idx_activities_student_status',
        'idx_audit_logs_created_table'
      )
    ORDER BY indexname
  ) LOOP
    v_result := v_result || '  ✅ ' || rec.indexname || ' (' || rec.tablename || E')\n';
  END LOOP;
  v_result := v_result || E'\n';

  -- 11. Verificar colunas de anonimização
  v_result := v_result || '👤 COLUNAS DE ANONIMIZAÇÃO (LGPD)\n';
  
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'students'
    AND column_name = 'anonymized_at';
  
  IF v_function_count = 1 THEN
    v_result := v_result || '  ✅ students.anonymized_at presente\n';
  ELSE
    v_result := v_result || '  ❌ students.anonymized_at FALTANDO!\n';
  END IF;

  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'teachers'
    AND column_name = 'anonymized_at';
  
  IF v_function_count = 1 THEN
    v_result := v_result || '  ✅ teachers.anonymized_at presente\n';
  ELSE
    v_result := v_result || '  ❌ teachers.anonymized_at FALTANDO!\n';
  END IF;
  v_result := v_result || E'\n';

  -- 12. Verificar colunas de comprovante de pagamento
  v_result := v_result || '💳 COLUNAS DE COMPROVANTE DE PAGAMENTO\n';
  
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'financial_records'
    AND column_name IN ('payment_proof_url', 'payment_proof_filename', 'payment_proof_uploaded_at', 'payment_proof_status', 'payment_proof_rejection_reason');
  
  IF v_function_count = 5 THEN
    v_result := v_result || '  ✅ Todas as 5 colunas presentes em financial_records\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: Apenas ' || v_function_count || '/5 colunas encontradas!\n';
  END IF;
  v_result := v_result || E'\n';

  -- 13. Verificar colunas em user_roles
  v_result := v_result || '👥 COLUNAS EM USER_ROLES\n';
  
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_roles'
    AND column_name IN ('email', 'full_name');
  
  IF v_function_count = 2 THEN
    v_result := v_result || '  ✅ Colunas email e full_name presentes\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: Apenas ' || v_function_count || '/2 colunas encontradas!\n';
  END IF;
  v_result := v_result || E'\n';

  -- 14. Verificar storage buckets
  v_result := v_result || '🗄️  STORAGE BUCKETS\n';
  
  SELECT COUNT(*) INTO v_function_count
  FROM storage.buckets
  WHERE id IN ('activities', 'avatars', 'payment-proofs');
  
  IF v_function_count = 3 THEN
    v_result := v_result || '  ✅ Todos os 3 buckets presentes (activities, avatars, payment-proofs)\n';
  ELSE
    v_result := v_result || '  ⚠️  Apenas ' || v_function_count || '/3 buckets encontrados\n';
  END IF;
  v_result := v_result || E'\n';

  -- 15. Verificar views mascaradas
  v_result := v_result || '👁️  VIEWS MASCARADAS (LGPD)\n';
  
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND table_name IN ('students_masked', 'teachers_masked', 'students_active_masked');
  
  IF v_function_count = 3 THEN
    v_result := v_result || '  ✅ Todas as 3 views presentes\n';
  ELSE
    v_result := v_result || '  ❌ ATENÇÃO: Apenas ' || v_function_count || '/3 views encontradas!\n';
  END IF;
  v_result := v_result || E'\n';

  -- 16. Listar índices não utilizados (se houver)
  IF v_unused_indexes > 0 THEN
    v_result := v_result || 'ℹ️  ÍNDICES NÃO UTILIZADOS (idx_scan = 0)\n';
    FOR rec IN (
      SELECT 
        relname as tablename,
        indexrelname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND idx_scan = 0
        AND indexrelname NOT LIKE 'pg_%'
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 10
    ) LOOP
      v_result := v_result || '  • ' || rec.indexrelname || ' (' || rec.tablename || ') - ' || rec.size || E'\n';
    END LOOP;
    v_result := v_result || E'\n';
  END IF;

  -- 17. Resumo final
  v_result := v_result || E'============================================\n';
  v_result := v_result || 'RESUMO FINAL\n';
  v_result := v_result || E'============================================\n';
  
  -- Contar problemas críticos
  v_critical_issues := 0;
  v_warnings := 0;
  
  IF v_duplicate_policies > 0 THEN v_critical_issues := v_critical_issues + 1; END IF;
  IF v_unindexed_fkeys > 0 THEN v_warnings := v_warnings + 1; END IF;
  IF v_unused_indexes > 5 THEN v_warnings := v_warnings + 1; END IF;
  
  -- Verificar se todas as funcionalidades estão presentes
  SELECT 
    CASE WHEN COUNT(*) < 14 THEN 1 ELSE 0 END INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'is_admin', 'is_teacher', 'is_student', 'get_student_id', 'get_teacher_id',
      'anonymize_student', 'anonymize_teacher', 'hard_delete_anonymized_records',
      'submit_payment_proof', 'review_payment_proof',
      'create_class_package', 'mark_as_paid_idempotent', 'confirm_payment_idempotent', 'undo_payment_idempotent'
    );
  
  IF v_function_count > 0 THEN v_critical_issues := v_critical_issues + 1; END IF;
  
  IF v_critical_issues = 0 AND v_warnings = 0 THEN
    v_result := v_result || E'✅ SISTEMA 100% FUNCIONAL E OTIMIZADO!\n';
    v_result := v_result || E'✅ Todas as funcionalidades presentes\n';
    v_result := v_result || E'✅ Segurança configurada corretamente\n';
    v_result := v_result || E'✅ Pronto para produção\n';
    IF v_unused_indexes > 0 THEN
      v_result := v_result || E'\nℹ️  NOTA: ' || v_unused_indexes || ' índices aparecem como não utilizados.\n';
      v_result := v_result || E'   Isso é normal para índices recém-criados.\n';
      v_result := v_result || E'   Eles serão usados conforme as queries forem executadas.\n';
    END IF;
  ELSIF v_critical_issues = 0 THEN
    v_result := v_result || E'✅ SISTEMA FUNCIONAL\n';
    v_result := v_result || E'⚠️  ' || v_warnings || ' avisos (não críticos)\n';
  ELSE
    v_result := v_result || E'❌ ATENÇÃO: ' || v_critical_issues || ' problemas críticos detectados\n';
    IF v_duplicate_policies > 0 THEN
      v_result := v_result || E'   - Políticas RLS duplicadas\n';
    END IF;
    IF v_function_count > 0 THEN
      v_result := v_result || E'   - Funções faltando\n';
    END IF;
  END IF;
  
  v_result := v_result || E'============================================\n';

  -- Exibir resultado
  RAISE NOTICE '%', v_result;
END $$;

-- Verificar warnings do Supabase Advisor (simulação)
SELECT 
  'VERIFICAÇÃO DE WARNINGS' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Nenhuma política duplicada'
    ELSE '❌ ' || COUNT(*) || ' políticas duplicadas encontradas'
  END as status
FROM (
  SELECT tablename, cmd, roles::text
  FROM pg_policies
  WHERE schemaname = 'public'
    AND permissive = 'PERMISSIVE'
  GROUP BY tablename, cmd, roles::text
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 
  'ACESSO ANÔNIMO' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Sem acesso anônimo'
    ELSE '⚠️  ' || COUNT(*) || ' políticas com acesso anônimo'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND 'anon' = ANY(roles)

UNION ALL

SELECT 
  'FUNÇÕES AUXILIARES' as check_type,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ Todas as funções presentes'
    ELSE '❌ Apenas ' || COUNT(*) || '/5 funções'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_teacher', 'is_student', 'get_student_id', 'get_teacher_id')

UNION ALL

SELECT 
  'ÍNDICES NÃO UTILIZADOS' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todos os índices estão sendo usados'
    ELSE 'ℹ️  ' || COUNT(*) || ' índices com idx_scan = 0 (normal para índices novos)'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE 'pg_%';

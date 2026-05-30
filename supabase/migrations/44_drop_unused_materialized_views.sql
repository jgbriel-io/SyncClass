-- Migration 44: Drop unused materialized views
-- activities_dashboard and financial_dashboard were never queried by the frontend.
-- All dashboard data is fetched via direct table queries and RPCs.

DROP MATERIALIZED VIEW IF EXISTS public.activities_dashboard;
DROP MATERIALIZED VIEW IF EXISTS public.financial_dashboard;

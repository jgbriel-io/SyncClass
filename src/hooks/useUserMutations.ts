// Barrel de re-exports — implementações divididas por responsabilidade
export type { InviteUserBody, InviteUserResult } from "./inviteUserService";
export {
  useCreateUser,
  useResetPassword,
  useResetOwnPassword,
} from "./useUserAuthMutations";
export {
  useUpdateUserRole,
  useUpdateUserProfile,
  useUpdateMyProfile,
  useUploadAvatar,
  useDeleteUser,
  useHardDeleteUser,
  useUpdateProfileName,
  useUpdateProfileEmail,
} from "./useUserProfileMutations";
export {
  useLinkUserToStudent,
  useLinkUserToTeacher,
  useCreateAuthUserForStudent,
  useCreateAuthUserForTeacher,
} from "./useUserLinkMutations";
export { useInviteStudent, useInviteTeacher } from "./useUserInviteMutations";

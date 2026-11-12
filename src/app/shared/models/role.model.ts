export type Role =
  'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'DEPARTMENT_ADMIN' | 'BRANCH_USER' | 'OPERATOR' | 'FLAG_OFFICER';
export type UserType =
  | 'SuperAdmin'
  | 'BranchAdmin'
  | 'BranchArea'
  | 'DepartmentAdmin'
  | 'BranchUser'
  | 'Operator'
  | 'FlagOfficer';

export const USER_TYPE_ROLES: Readonly<Record<UserType, Role>> = {
  SuperAdmin: 'SUPER_ADMIN',
  BranchAdmin: 'BRANCH_ADMIN',
  BranchArea: 'BRANCH_ADMIN',
  DepartmentAdmin: 'DEPARTMENT_ADMIN',
  BranchUser: 'BRANCH_USER',
  Operator: 'OPERATOR',
  FlagOfficer: 'FLAG_OFFICER',
};

export function isUserType(value: unknown): value is UserType {
  return typeof value === 'string' && Object.hasOwn(USER_TYPE_ROLES, value);
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string;
  branchNameEn?: string;
  branchNameAr?: string;
  departmentId?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  userType: UserType;
  roles: readonly string[];
  permissions: readonly string[];
  firstLoginFlag?: boolean;
  passwordExpiredFlag?: boolean;
  passwordChangedOnUtc?: string;
  passwordExpiresOnUtc?: string;
  expiresAt?: number;
}

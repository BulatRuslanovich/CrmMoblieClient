export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ActivResponse {
  activId: number;
  usrId: number;
  usrLogin: string;
  orgId: number;
  orgName: string;
  statusId: number;
  statusName: string;
  start: string | null;
  end: string | null;
  description: string | null;
  result: string | null;
  drugs: string[];
}

export interface CreateActivRequest {
  orgId: number;
  statusId: number;
  start: string | null;
  end: string | null;
  description: string | null;
  result: string | null;
  drugIds: number[];
}

export interface UpdateActivRequest {
  statusId: number | null;
  start: string | null;
  end: string | null;
  description: string | null;
  result: string | null;
}

export interface DrugResponse {
  drugId: number;
  drugName: string;
  brand: string | null;
  form: string | null;
  description: string | null;
}

export interface OrgResponse {
  orgId: number;
  orgTypeId: number;
  orgTypeName: string;
  orgName: string;
  inn: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface CreateOrgRequest {
  orgTypeId: number;
  orgName: string;
  inn: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface UpdateOrgRequest {
  orgTypeId: number | null;
  orgName: string | null;
  inn: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface CreatePhysRequest {
  specId: number | null;
  firstName: string | null;
  lastName: string;
  middleName: string | null;
  phone: string | null;
  email: string | null;
  position: string | null;
}

export interface UpdatePhysRequest {
  specId: number | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  phone: string | null;
  email: string | null;
  position: string | null;
}

export interface OrgTypeResponse {
  orgTypeId: number;
  orgTypeName: string;
}

export interface PhysResponse {
  physId: number;
  specId: number | null;
  specName: string | null;
  firstName: string | null;
  lastName: string;
  middleName: string | null;
  phone: string | null;
  email: string | null;
  position: string | null;
  orgs: string[];
}

export interface SpecResponse {
  specId: number;
  specName: string;
}

export interface StatusResponse {
  statusId: number;
  statusName: string;
}

export interface UserResponse {
  usrId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  login: string;
  policies: string[];
}

export interface PolicyResponse {
  policyId: number;
  policyName: string;
}

export interface CreateUserRequest {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  login: string;
  password: string;
  policyIds: number[];
}

export interface UpdateDrugRequest {
  drugName: string | null;
  brand: string | null;
  form: string | null;
  description: string | null;
}

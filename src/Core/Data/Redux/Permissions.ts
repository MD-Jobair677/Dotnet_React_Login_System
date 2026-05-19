import { baseApi } from './baseApi';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type PermissionNamesResponse = {
  names: string[];
};

export type Permission = {
  id: number;
  name: string;
};

export type RolePermission = {
  permissionId: number;
  roleId: number;
};

export type UpdateRolePermissionsRequest = {
  roleId: number;
  permissionIds: number[];
};

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPermissions: builder.query<ApiResponse<Permission[]>, void>({
      query: () => ({
        url: 'permissions',
        method: 'GET',
      }),
      providesTags: ['Permissions'],
      transformResponse: (response: ApiResponse<Permission[]> | PermissionNamesResponse | Permission[]) => {
        if (!response) return { success: true, data: [] } as ApiResponse<Permission[]>;
        
        if (Array.isArray(response)) {
          return { success: true, data: response } as ApiResponse<Permission[]>;
        }
        
        if ('names' in response && Array.isArray(response.names)) {
          const permissions: Permission[] = response.names.map((name, index) => ({
            id: index + 1,
            name: name,
          }));
          return { success: true, data: permissions } as ApiResponse<Permission[]>;
        }
        
        return response as ApiResponse<Permission[]>;
      },
    }),

    getRolePermissions: builder.query<ApiResponse<number[]>, number>({
      query: (roleId) => ({
        url: `Roles/${roleId}/permissions`,
        method: 'GET',
      }),
      providesTags: (_result, _error, roleId) => [
        { type: 'Permissions', id: `ROLE-${roleId}` },
      ],
      transformResponse: (response: ApiResponse<number[]> | number[]) => {
        if (Array.isArray(response)) {
          return { success: true, data: response } as ApiResponse<number[]>;
        }
        return response;
      },
    }),

    createPermission: builder.mutation<ApiResponse<unknown>, { name: string; description?: string }>({
      query: (body) => ({
        url: 'Roles/show/all/permissions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Permissions'],
    }),

    updatePermission: builder.mutation<ApiResponse<unknown>, { id: number; name: string; description?: string }>({
      query: ({ id, ...body }) => ({
        url: `Roles/show/all/permissions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Permissions'],
    }),

    deletePermission: builder.mutation<ApiResponse<unknown>, number>({
      query: (id) => ({
        url: `Roles/show/all/permissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Permissions'],
    }),

    updateRolePermissions: builder.mutation<ApiResponse<unknown>, RolePermission>({
      query: ({ roleId, permissionId }) => ({
        url: `Roles/${roleId}/Permissions/${permissionId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        'Roles',
        { type: 'Permissions', id: `ROLE-${roleId}` },
      ],
    }),

    replaceRolePermissions: builder.mutation<ApiResponse<unknown>, UpdateRolePermissionsRequest>({
      query: ({ roleId, permissionIds }) => ({
        url: `Roles/${roleId}/permissions`,
        method: 'PUT',
        body: { permissionIds },
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        'Roles',
        { type: 'Permissions', id: `ROLE-${roleId}` },
      ],
    }),
  }),
});

export const {
  useGetAllPermissionsQuery,
  useGetRolePermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useUpdateRolePermissionsMutation,
  useReplaceRolePermissionsMutation,
} = permissionsApi;

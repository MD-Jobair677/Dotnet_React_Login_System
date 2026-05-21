import { baseApi } from './baseApi';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type Role = {
  id: number;
  name: string;
  description?: string | null;
  permissions?: string[];
};

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllRoles: builder.query<ApiResponse<Role[]>, void>({
      query: () => ({
        url: 'Roles',
        method: 'GET',
      }),
      providesTags: ['Roles'],
      transformResponse: (response: ApiResponse<Role[]> | Role[]) => {
        if (Array.isArray(response)) {
          return { success: true, data: response } as ApiResponse<Role[]>;
        }
        return response;
      },
    }),

    createRole: builder.mutation<ApiResponse<unknown>, { name: string; description?: string }>({
      query: (body) => ({
        url: 'Roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Roles'],
    }),

    updateRole: builder.mutation<ApiResponse<unknown>, { id: number; name: string; description?: string }>({
      query: ({ id, name, description }) => ({
        url: `Roles/${id}`,
        method: 'PUT',
        body: { name, description },
      }),
      invalidatesTags: ['Roles'],
    }),

    deleteRole: builder.mutation<ApiResponse<unknown>, number>({
      query: (id) => ({
        url: `Roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),
  }),
});

export const {
  useGetAllRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesApi;

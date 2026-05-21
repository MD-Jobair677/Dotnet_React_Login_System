import { baseApi } from './baseApi';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  roles: string[];
  permissions: string[];
};

export type UpdateUserRolesRequest = {
  userId: number;
  roleIds: number[];
};

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<ApiResponse<User[]>, void>({
      query: () => ({
        url: 'Users',
        method: 'GET',
      }),
      providesTags: ['User'],
      transformResponse: (response: ApiResponse<User[]> | User[]) => {
        if (Array.isArray(response)) {
          return { success: true, data: response } as ApiResponse<User[]>;
        }
        return response;
      },
    }),

    getUserRoles: builder.query<ApiResponse<number[]>, number>({
      query: (userId) => ({
        url: `Users/${userId}/roles`,
        method: 'GET',
      }),
      providesTags: (_result, _error, userId) => [{ type: 'User', id: `ROLES-${userId}` }],
      transformResponse: (response: ApiResponse<number[]> | number[]) => {
        if (Array.isArray(response)) {
          return { success: true, data: response } as ApiResponse<number[]>;
        }
        return response;
      },
    }),

    updateUserRoles: builder.mutation<ApiResponse<unknown>, UpdateUserRolesRequest>({
      query: ({ userId, roleIds }) => ({
        url: `Users/${userId}/roles`,
        method: 'PUT',
        body: { roleIds },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        'User',
        { type: 'User', id: `ROLES-${userId}` },
      ],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserRolesQuery,
  useUpdateUserRolesMutation,
} = usersApi;

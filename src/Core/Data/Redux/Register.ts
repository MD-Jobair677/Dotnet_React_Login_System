import { baseApi } from './baseApi';

type RegisterPayload = Record<string, unknown>;
type LoginPayload = Record<string, unknown>;

export const registerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation<unknown, RegisterPayload>({
      query: (submitData) => ({
        url: '/register',
        method: 'POST',
        body: submitData,
      }),
      invalidatesTags: ['User'],
    }),
    loginUser: builder.mutation<unknown, LoginPayload>({
      query: (loginData) => ({
        url: '/login',
        method: 'POST',
        body: loginData,
      }),
    }),
  }),
});

export const { useRegisterUserMutation, useLoginUserMutation } = registerApi;

import { baseApi } from './baseApi';

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const registerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation<unknown, RegisterPayload>({
      query: (submitData) => ({
        url: 'Auth/register',
        method: 'POST',
        body: submitData,
      }),
      invalidatesTags: ['User'],
    }),
    loginUser: builder.mutation<unknown, LoginPayload>({
      query: (loginData) => ({
        url: 'Auth/login',
        method: 'POST',
        body: loginData,
      }),
    }),
  }),
});

export const { useRegisterUserMutation, useLoginUserMutation } = registerApi;

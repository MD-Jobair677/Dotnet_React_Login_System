import { baseApi } from "./baseApi";

export const registerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (submitData) => ({
        url: "/register",
        method: "POST",
        body: submitData,
      }),
      invalidatesTags: ["User"],
    }),

    loginUser: builder.mutation({
      query: (loginData) => ({
        url: "/login",
        method: "POST",
        body: loginData,
      }),
    }),
  }),
});

import { baseApi } from './baseApi';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type StudentProfile = {
  id: number;
  profileImage?: string | null;
};

export type Student = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  profile?: StudentProfile | null;
};

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllStudents: builder.query<ApiResponse<Student[]>, void>({
      query: () => ({
        url: 'Student/all',
        method: 'GET',
      }),
      providesTags: ['Students'],
    }),

    createStudent: builder.mutation<ApiResponse<unknown>, FormData>({
      query: (formData) => ({
        url: 'Student/create/student',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Students'],
    }),

    updateStudent: builder.mutation<ApiResponse<unknown>, { id: number; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `Student/update/${id}`,
        method: 'PUT',
        body: (() => {
          // backend signature uses [FromForm] int id, so include it too
          formData.set('id', String(id));
          return formData;
        })(),
      }),
      invalidatesTags: ['Students'],
    }),

    deleteStudent: builder.mutation<ApiResponse<unknown>, number>({
      query: (id) => ({
        url: `Student/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Students'],
    }),
  }),
});

export const {
  useGetAllStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi;

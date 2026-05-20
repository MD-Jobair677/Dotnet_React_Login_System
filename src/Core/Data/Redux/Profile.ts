import { baseApi } from './baseApi';

export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export type UserAsset = {
  assetName: string;
  assetType: string;
  path: string;
  updatedAt: string;
};

export type UserProfileResponse = {
  message: string;
  user: UserProfile;
  profile: {
    phone: string;
    address: string;
    gender: string;
    dateOfBirth: string;
    bio: string;
  };
  asset: UserAsset;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  bio?: string;
  file?: File;
};

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateUserProfile: builder.mutation<UserProfileResponse, FormData>({
      query: (formData) => ({
        url: 'Auth/user-profile-update',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useUpdateUserProfileMutation } = profileApi;
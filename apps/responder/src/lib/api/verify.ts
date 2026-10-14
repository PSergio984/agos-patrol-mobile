import type {
  ResponderRegistrationRequest,
  ResponderOTPVerifyRequest,
  ResponderVerifyRequest,
  ResponderOTPVerifyResponse,
  ResponderOTPDispatchResponse,
} from "../../types/verify";
import apiClient from "./client";

export const verifyAPI = {
  getResponderDetailsForApproval: async (
    request: ResponderRegistrationRequest
  ): Promise<ResponderVerifyRequest> => {
    const res = await apiClient.post(`/responder/for-approval`, request);
    return res.data as ResponderVerifyRequest;
  },

  resendVerificationOTP: async (
    responderId: string
  ): Promise<ResponderOTPDispatchResponse> => {
    const res = await apiClient.post(`/responder/resend-otp/${responderId}`);
    return res.data as ResponderOTPDispatchResponse;
  },

  verifyOTP: async (
    request: ResponderOTPVerifyRequest
  ): Promise<ResponderOTPVerifyResponse> => {
    const res = await apiClient.post("/responder/verify-otp", request);
    return res.data as ResponderOTPVerifyResponse;
  },
};

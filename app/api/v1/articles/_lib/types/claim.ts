import { ClaimVerificationDTO } from "../dtos/claim-verification";

export type Claim = {
  content: string;
  verification: ClaimVerificationDTO | null;
};

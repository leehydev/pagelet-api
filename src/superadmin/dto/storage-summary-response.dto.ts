export class StorageSummaryResponseDto {
  totalUsedBytes: number;
  totalMaxBytes: number;
  usagePercentage: number;
  totalUsedDisplay: string;
  totalMaxDisplay: string;

  constructor(partial: Partial<StorageSummaryResponseDto>) {
    Object.assign(this, partial);
  }
}

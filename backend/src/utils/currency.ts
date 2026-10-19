/**
 * Financial Governance: ZERO Floating-Point Math for Currency.
 * All monetary amounts in the database are stored as integers representing Paise (1 INR = 100 Paise).
 * Example: ₹10,000.00 is stored as 1,000,000.
 */

export class CurrencyUtil {
  /**
   * Convert Rupees to Paise integer.
   * e.g., 10000.50 -> 1000050
   */
  public static rupeesToPaise(rupees: number | string): number {
    const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
    if (isNaN(num)) return 0;
    // Using Math.round to avoid standard IEEE 754 precision issues like 19.99 * 100 = 1998.9999999999998
    return Math.round(num * 100);
  }

  /**
   * Convert Paise integer to Rupees for display.
   * e.g., 1000050 -> 10000.50
   */
  public static paiseToRupees(paise: number): number {
    return paise / 100;
  }

  /**
   * Format Paise integer into Indian Currency String (e.g., ₹1,00,000.00).
   */
  public static formatINR(paise: number): string {
    const rupees = this.paiseToRupees(paise);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  }

  /**
   * Integer-safe Percentage Calculation: (basePaise * percent) / 100
   * Rounded to nearest Paise.
   */
  public static calculatePercentage(basePaise: number, percent: number): number {
    return Math.round((basePaise * percent) / 100);
  }

  /**
   * Calculate GTA Forward Charge GST (12% standard rate)
   * If intra-state: 6% CGST + 6% SGST
   * If inter-state: 12% IGST
   */
  public static calculateGTAGST(
    taxableAmountPaise: number,
    isInterState: boolean,
    gstRatePercent: number = 12
  ): {
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    totalGstPaise: number;
    finalTotalPaise: number;
  } {
    if (isInterState) {
      const igstPaise = this.calculatePercentage(taxableAmountPaise, gstRatePercent);
      return {
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise,
        totalGstPaise: igstPaise,
        finalTotalPaise: taxableAmountPaise + igstPaise,
      };
    } else {
      const halfRate = gstRatePercent / 2; // 6%
      const cgstPaise = this.calculatePercentage(taxableAmountPaise, halfRate);
      const sgstPaise = this.calculatePercentage(taxableAmountPaise, halfRate);
      const totalGstPaise = cgstPaise + sgstPaise;
      return {
        cgstPaise,
        sgstPaise,
        igstPaise: 0,
        totalGstPaise,
        finalTotalPaise: taxableAmountPaise + totalGstPaise,
      };
    }
  }
}

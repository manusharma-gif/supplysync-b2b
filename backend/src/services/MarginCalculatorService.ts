import { CurrencyUtil } from '../utils/currency.js';

export interface BrokerMarginResult {
  netMarginPaise: number;
  marginPercentage: number;
  isProfitable: boolean;
}

export interface GTAInvoiceCalculation {
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalGstPaise: number;
  finalTotalPaise: number;
  isInterState: boolean;
  gstRatePercent: number;
}

export class MarginCalculatorService {
  /**
   * Calculates exact Broker Margin in Paise integers without floating-point math:
   * Net Margin = (shipper_budget_paise - carrier_bid_paise)
   * Margin Percentage = (netMarginPaise / shipper_budget_paise) * 100
   */
  public calculateBrokerMargin(
    shipperBudgetPaise: number,
    carrierBidPaise: number
  ): BrokerMarginResult {
    const netMarginPaise = shipperBudgetPaise - carrierBidPaise;
    const marginPercentage =
      shipperBudgetPaise > 0
        ? Number(((netMarginPaise / shipperBudgetPaise) * 100).toFixed(2))
        : 0;

    return {
      netMarginPaise,
      marginPercentage,
      isProfitable: netMarginPaise >= 0,
    };
  }

  /**
   * Carrier Cost Score: Lower cost gets higher score (0-100)
   * Normalized relative to lowest bid on the load.
   */
  public calculateCostScore(carrierBidPaise: number, minBidPaise: number): number {
    if (carrierBidPaise <= 0) return 100;
    if (minBidPaise <= 0) return 100;
    return Math.round((minBidPaise / carrierBidPaise) * 100);
  }

  /**
   * Smart Carrier Recommendation Composite Score:
   * 70% weight on lowest bid price (Cost Score) + 30% weight on carrier reliability score
   */
  public calculateCompositeScore(costScore: number, reliabilityScore: number): number {
    const boundedReliability = Math.max(0, Math.min(100, reliabilityScore));
    const boundedCost = Math.max(0, Math.min(100, costScore));
    return Math.round(0.7 * boundedCost + 0.3 * boundedReliability);
  }

  /**
   * Indian Logistics Standard: 12% Forward-Charge GTA GST calculation
   * - Intra-State: 6% CGST + 6% SGST
   * - Inter-State: 12% IGST
   * Zero IEEE-754 floating-point math: all in integer Paise.
   */
  public calculateGTAInvoice(
    subtotalPaise: number,
    isInterState: boolean,
    gstRatePercent: number = 12
  ): GTAInvoiceCalculation {
    const breakdown = CurrencyUtil.calculateGTAGST(subtotalPaise, isInterState, gstRatePercent);

    return {
      subtotalPaise,
      cgstPaise: breakdown.cgstPaise,
      sgstPaise: breakdown.sgstPaise,
      igstPaise: breakdown.igstPaise,
      totalGstPaise: breakdown.totalGstPaise,
      finalTotalPaise: breakdown.finalTotalPaise,
      isInterState,
      gstRatePercent,
    };
  }
}

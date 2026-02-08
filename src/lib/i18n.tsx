"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type Lang = "en" | "kr";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // ── Dashboard shell ──
    "dashboard.title": "Korean Exchange Stablecoin Flows",
    "dashboard.subtitle":
      "USDC, USDT, DAI, BUSD, TUSD, FRAX across Upbit, Bithumb, Coinone, Korbit, GOPAX",
    "dashboard.mockNotice": "Mock data — Dune API paused to conserve credits",
    "dashboard.regenerate": "Regenerate Data",
    "dashboard.crossProductTitle": "Cross-Product Indices",
    "dashboard.crossProductSub":
      "Advanced analytics serving Upbit Exchange, Staking, Lending, and Custody products",
    "dashboard.refTitle": "Cross-Product Index Reference",
    "dashboard.refIndex": "Index",
    "dashboard.refProducts": "Products Served",
    "dashboard.refDescription": "Description",

    // ── Products ──
    "product.Exchange": "Exchange",
    "product.Staking": "Staking",
    "product.Lending": "Lending",
    "product.Custody": "Custody",

    // ── Index names ──
    "index.netFlow": "Korea Net Stablecoin Flow",
    "index.reserve": "Exchange Reserve Level",
    "index.whale": "Whale Alerts",
    "index.substitution": "Stablecoin Substitution Ratio",
    "index.counterparty": "Counterparty Exchange Breakdown",
    "index.defi": "DeFi Outflow Tracking",
    "index.crossChain": "Cross-Chain Flow Patterns",

    // ── Index descriptions (reference table) ──
    "indexDesc.netFlow":
      "Hourly aggregate inflow/outflow for all Korean exchanges, excluding insular Korean-to-Korean transfers.",
    "indexDesc.reserve":
      "Cumulative net stablecoin reserves by region (Korea / US / International) over 30 days.",
    "indexDesc.whale":
      "Individual transfers > $1M to/from Korean exchanges in the last 7 days.",
    "indexDesc.substitution":
      "Daily USDC vs USDT share of total Korean exchange flow — early panic and institutional-flow indicator.",
    "indexDesc.counterparty":
      "Which foreign exchanges (US / International / DeFi) are the source and destination of Korean flows.",
    "indexDesc.defi":
      "Stablecoins leaving Korean exchanges to DeFi wallets vs other exchanges over 30 days.",
    "indexDesc.crossChain":
      "Stablecoin flow volume by blockchain (Ethereum, Arbitrum, Base, etc.) for Korean exchanges.",

    // ── Summary cards ──
    "summary.totalInflow": "Total Inflow",
    "summary.totalOutflow": "Total Outflow",
    "summary.netFlow": "Net Flow",
    "summary.transactions": "Transactions (7d)",
    "summary.intoKorean": "into Korean exchanges",
    "summary.outOfKorean": "out of Korean exchanges",
    "summary.netInflow": "net inflow",
    "summary.netOutflow": "net outflow",
    "summary.totalTransfers": "total transfers",

    // ── Common chart labels ──
    "chart.inflow": "Inflow",
    "chart.outflow": "Outflow",
    "chart.netFlow": "Net Flow",

    // ── Time series ──
    "chart.timeSeriesTitle": "Korea Net Stablecoin Flow (7d, Hourly)",
    "chart.timeSeriesSignal":
      "A sustained net inflow above $50M/day to Korean exchanges signals sell-side pressure building. Sudden spikes often precede 4-12 hour BTC/ETH price drops. Conversely, large outflows indicate accumulation — smart money moving to cold storage.",

    // ── Exchange breakdown ──
    "chart.exchangeTitle": "Flow by Exchange",
    "chart.exchangeSignal":
      "Upbit dominance >70% is normal for the Korean market. A sudden rise in Bithumb or Coinone share often signals arbitrage opportunities or exchange-specific promotions driving flow. Watch for new exchanges gaining share — it may indicate regulatory shifts.",

    // ── Stablecoin breakdown ──
    "chart.stablecoinTitle": "Volume by Stablecoin",
    "chart.stablecoinSignal":
      "USDT dominance >80% is retail-driven (Tether is the Korean market standard). A USDC share increase above 20% signals institutional or US-linked capital entering. Watch DAI share — a spike means DeFi-native capital is interacting with Korean exchanges.",

    // ── Reserve level ──
    "chart.reserveTitle": "Exchange Reserve Level (Cumulative Net Flow)",
    "chart.reserveSignal":
      "Rising cumulative net flow = stablecoins accumulating on exchanges (selling pressure building). Divergence between Korea and US curves signals regional sentiment asymmetry — a Korea-only spike often precedes kimchi premium moves.",

    // ── Substitution ratio ──
    "chart.substitutionTitle": "Stablecoin Substitution Ratio",
    "chart.substitutionSignal":
      "A sudden shift from USDT-dominant to USDC-dominant flows signals institutional money entering (USDC = regulated, audited). Before the SVB/USDC depeg, smart money flipped from USDC to USDT 6-12 hours before the news — this ratio is an early panic indicator.",

    // ── Counterparty breakdown ──
    "chart.counterpartyTitle": "Counterparty Exchange Breakdown",
    "chart.counterpartySignal":
      "If >60% of outflows go to 'DeFi / Unknown' addresses, capital is leaving the exchange ecosystem entirely (DeFi yield farming or cold storage). Heavy US-exchange flows indicate arbitrage. A sudden shift from International→DeFi outflows signals loss of confidence in centralized exchanges.",
    "chart.byRegion": "By Region",
    "chart.topCounterparties": "Top Counterparties",
    "chart.noData": "No data",

    // ── DeFi outflow ──
    "chart.defiTitle": "DeFi Outflow Tracking",
    "chart.defiSignal":
      "Stablecoins leaving Korean exchanges to DeFi wallets = users seeking yield elsewhere (lost revenue for Upbit Lending/Staking). If DeFi outflows exceed exchange-to-exchange outflows, Upbit should consider matching DeFi rates. A spike in DeFi outflows during market calm = users positioning for on-chain strategies.",

    // ── Cross-chain flow ──
    "chart.crossChainTitle": "Cross-Chain Flow Patterns",
    "chart.crossChainSignal":
      "Stablecoins moving from L2s (Arbitrum, Base) to Ethereum mainnet then to Korean exchanges often precedes large selling. A chain gaining share indicates Upbit should prioritize supporting that chain's deposit/withdrawal. Ethereum dominance dropping below 50% signals L2 maturation.",

    // ── Whale alerts ──
    "chart.whaleTitle": "Whale Alerts (> $1M, 7d)",
    "chart.whaleSignal":
      "Whale transfers > $1M are leading indicators. Clusters of large inflows often precede major sell-offs within 4-12 hours. Large outflows to cold wallets signal accumulation. Track the rate of change — 3+ whale moves in the same direction within an hour is a strong signal.",
    "whale.time": "Time",
    "whale.exchange": "Exchange",
    "whale.dir": "Dir",
    "whale.coin": "Coin",
    "whale.amount": "Amount",
    "whale.tx": "Tx",
    "whale.noData": "No whale transfers in the last 7 days.",
  },

  kr: {
    // ── Dashboard shell ──
    "dashboard.title": "한국 거래소 스테이블코인 자금 흐름",
    "dashboard.subtitle":
      "업비트, 빗썸, 코인원, 코빗, 고팍스의 USDC, USDT, DAI, BUSD, TUSD, FRAX 추적",
    "dashboard.mockNotice": "모의 데이터 — Dune API 크레딧 절약을 위해 일시 중단",
    "dashboard.regenerate": "데이터 재생성",
    "dashboard.crossProductTitle": "교차 상품 지표",
    "dashboard.crossProductSub":
      "업비트 거래소, 스테이킹, 대출, 수탁 상품을 위한 고급 분석",
    "dashboard.refTitle": "교차 상품 지표 참조표",
    "dashboard.refIndex": "지표",
    "dashboard.refProducts": "관련 상품",
    "dashboard.refDescription": "설명",

    // ── Products ──
    "product.Exchange": "거래소",
    "product.Staking": "스테이킹",
    "product.Lending": "대출",
    "product.Custody": "수탁",

    // ── Index names ──
    "index.netFlow": "한국 순 스테이블코인 흐름",
    "index.reserve": "거래소 준비금 수준",
    "index.whale": "고래 알림",
    "index.substitution": "스테이블코인 대체 비율",
    "index.counterparty": "상대방 거래소 분석",
    "index.defi": "DeFi 유출 추적",
    "index.crossChain": "크로스체인 흐름 패턴",

    // ── Index descriptions (reference table) ──
    "indexDesc.netFlow":
      "한국 내 거래소 간 이체를 제외한 모든 한국 거래소의 시간별 유입/유출 합계.",
    "indexDesc.reserve":
      "지역별(한국 / 미국 / 해외) 30일 누적 순 스테이블코인 준비금.",
    "indexDesc.whale":
      "최근 7일간 한국 거래소 대상 100만 달러 이상 개별 이체.",
    "indexDesc.substitution":
      "한국 거래소 흐름에서 USDC 대 USDT 일별 비율 — 패닉 및 기관 자금 조기 지표.",
    "indexDesc.counterparty":
      "한국 자금의 출처 및 도착지 해외 거래소 (미국 / 해외 / DeFi) 분석.",
    "indexDesc.defi":
      "30일간 한국 거래소에서 DeFi 지갑 대 기타 거래소로의 스테이블코인 유출.",
    "indexDesc.crossChain":
      "한국 거래소의 블록체인별(이더리움, 아비트럼, 베이스 등) 스테이블코인 흐름량.",

    // ── Summary cards ──
    "summary.totalInflow": "총 유입",
    "summary.totalOutflow": "총 유출",
    "summary.netFlow": "순 흐름",
    "summary.transactions": "거래 건수 (7일)",
    "summary.intoKorean": "한국 거래소 유입",
    "summary.outOfKorean": "한국 거래소 유출",
    "summary.netInflow": "순 유입",
    "summary.netOutflow": "순 유출",
    "summary.totalTransfers": "총 이체 건수",

    // ── Common chart labels ──
    "chart.inflow": "유입",
    "chart.outflow": "유출",
    "chart.netFlow": "순 흐름",

    // ── Time series ──
    "chart.timeSeriesTitle": "한국 순 스테이블코인 흐름 (7일, 시간별)",
    "chart.timeSeriesSignal":
      "예를 들어 한국 거래소로의 지속적인 순 유입이 일 $5천만을 초과하면 매도 압력이 형성되고 있음을 나타냅니다. 급격한 스파이크는 4-12시간 내 BTC/ETH 가격 하락에 선행하는 경우가 많습니다. 반대로 대규모 유출은 축적을 의미합니다 — 기관투자자 등 스마트 머니가 콜드 스토리지로 이동.",

    // ── Exchange breakdown ──
    "chart.exchangeTitle": "거래소별 흐름",
    "chart.exchangeSignal":
      "업비트 점유율 70% 이상은 한국 시장에서 정상입니다. 빗썸이나 코인원의 갑작스러운 점유율 상승은 차익거래 기회 또는 거래소 프로모션을 나타낼 수 있습니다. 새로운 거래소의 점유율 상승은 규제 변화를 시사할 수 있습니다.",

    // ── Stablecoin breakdown ──
    "chart.stablecoinTitle": "스테이블코인별 거래량",
    "chart.stablecoinSignal":
      "USDT 점유율 80% 이상은 개인 투자자 중심입니다 (테더는 한국 시장 표준). USDC 점유율이 20%를 초과하면 기관 또는 미국 연계 자본 유입을 나타냅니다. DAI 점유율 급등은 DeFi 네이티브 자본이 한국 거래소와 상호작용하고 있음을 의미합니다.",

    // ── Reserve level ──
    "chart.reserveTitle": "거래소 준비금 수준 (누적 순 흐름)",
    "chart.reserveSignal":
      "누적 순 흐름 상승 = 거래소에 스테이블코인 축적 (매도 압력 형성). 한국과 미국 곡선의 괴리는 지역별 심리 비대칭을 나타냅니다 — 한국만의 급등은 코리안 프리미엄 변동에 선행하는 경우가 많습니다.",

    // ── Substitution ratio ──
    "chart.substitutionTitle": "스테이블코인 대체 비율",
    "chart.substitutionSignal":
      "USDT 우세에서 USDC 우세로의 급격한 전환은 기관 자금 유입을 나타냅니다 (USDC = 규제 준수, 감사 완료). SVB/USDC 디페그 전 기관 투자자들은 뉴스 6-12시간 전에 USDC에서 USDT로 전환했습니다 — 이 비율은 각국 중앙은행, 투자자들이 사용하는 조기 패닉 지표입니다.",

    // ── Counterparty breakdown ──
    "chart.counterpartyTitle": "상대방 거래소 분석",
    "chart.counterpartySignal":
      "유출의 60% 이상이 'DeFi / 미확인' 주소로 향하면 자본이 거래소 생태계를 완전히 이탈하고 있습니다 (DeFi 이자 농사 또는 콜드 스토리지). 미국 거래소 흐름이 많으면 차익거래를 나타냅니다. 해외→DeFi 유출의 급격한 전환은 중앙화 거래소에 대한 신뢰 하락을 시사합니다.",
    "chart.byRegion": "지역별",
    "chart.topCounterparties": "상위 상대방",
    "chart.noData": "데이터 없음",

    // ── DeFi outflow ──
    "chart.defiTitle": "DeFi 유출 추적",
    "chart.defiSignal":
      "한국 거래소에서 DeFi 지갑으로의 스테이블코인 유출 = 사용자가 다른 곳에서 수익을 추구 (업비트 대출/스테이킹 수익 손실). DeFi 유출이 거래소 간 유출을 초과하면 업비트는 DeFi 금리를 맞추는 것을 고려해야 합니다. 시장 안정기의 DeFi 유출 급등 = 사용자가 온체인 전략을 준비 중.",

    // ── Cross-chain flow ──
    "chart.crossChainTitle": "크로스체인 흐름 패턴",
    "chart.crossChainSignal":
      "L2(아비트럼, 베이스)에서 이더리움 메인넷으로 이동 후 한국 거래소로의 스테이블코인 이동은 대규모 매도에 선행하는 경우가 많습니다. 특정 체인의 점유율 상승은 업비트가 해당 체인의 입출금을 우선 지원해야 함을 나타냅니다. 이더리움 점유율이 50% 이하로 하락하면 L2 성숙을 시사합니다.",

    // ── Whale alerts ──
    "chart.whaleTitle": "고래 알림 (> $1M, 7일)",
    "chart.whaleSignal":
      "$100만 이상 고래 이체는 선행 지표입니다. 대규모 유입의 클러스터는 4-12시간 내 대규모 매도에 선행하는 경우가 많습니다. 콜드 월렛으로의 대규모 유출은 축적을 나타냅니다. 변화율을 추적하세요 — 1시간 내 같은 방향으로 3건 이상의 고래 이동은 강한 신호입니다.",
    "whale.time": "시간",
    "whale.exchange": "거래소",
    "whale.dir": "방향",
    "whale.coin": "코인",
    "whale.amount": "금액",
    "whale.tx": "Tx",
    "whale.noData": "최근 7일간 고래 이체가 없습니다.",
  },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const t = useCallback(
    (key: string): string => {
      return translations[lang][key] ?? key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

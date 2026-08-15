// Atlas Business System — VERIFIED 50-state filing fee data.
//
// Every fee below was checked against the state's official Secretary of State
// (or equivalent agency) fee schedule / regulation during the week of
// 2026-08-15. `documentUrl` is the official forms-and-fees or online-filing
// page for the state (the durable target; individual form PDF URLs change).
// `note` records the source and any caveats (e.g. online-vs-mail, statutory
// add-ons, 2026 fee changes). Apply with `pnpm db:verify-fees`.

export type VerifiedFee = {
  cents: number;
  docUrl: string;
  time: string;
  note: string;
};

export type VerifiedState = {
  code: string;
  notes?: string;
  fees: {
    LLC: VerifiedFee;
    FOR_PROFIT: VerifiedFee;
    NON_PROFIT: VerifiedFee;
  };
};

export const VERIFIED_DATE = "2026-08-15";

export const VERIFIED_STATES: VerifiedState[] = [
  {
    code: "AL",
    notes: "All three entity types are a flat $200 at the AL SOS.",
    fees: {
      LLC: { cents: 20000, docUrl: "https://www.sos.alabama.gov/sites/default/files/form-files/FeeSchedule.pdf", time: "~1-2 weeks", note: "AL SOS fee schedule: LLC certificate of formation $200." },
      FOR_PROFIT: { cents: 20000, docUrl: "https://www.sos.alabama.gov/sites/default/files/form-files/FeeSchedule.pdf", time: "~1-2 weeks", note: "AL SOS fee schedule: domestic for-profit articles of incorporation $200." },
      NON_PROFIT: { cents: 20000, docUrl: "https://www.sos.alabama.gov/sites/default/files/form-files/FeeSchedule.pdf", time: "~1-2 weeks", note: "AL SOS 'Domestic Corporations' page: nonprofit filing fee $200 (name reservation additional ~$28)." },
    },
  },
  {
    code: "AK",
    fees: {
      LLC: { cents: 25000, docUrl: "https://www.commerce.alaska.gov/web/cbpl/Corporations/CorporationFormsFees", time: "~7-10 business days", note: "AK Division of Corporations: LLC articles of organization $250." },
      FOR_PROFIT: { cents: 25000, docUrl: "https://www.commerce.alaska.gov/web/cbpl/Corporations/CorporationFormsFees", time: "~7-10 business days", note: "AK Division of Corporations: for-profit articles of incorporation $250." },
      NON_PROFIT: { cents: 25000, docUrl: "https://www.commerce.alaska.gov/web/cbpl/Corporations/CorporationFormsFees", time: "~7-10 business days", note: "AK Division of Corporations: nonprofit articles of incorporation $250." },
    },
  },
  {
    code: "AZ",
    fees: {
      LLC: { cents: 5000, docUrl: "http://azcc.gov/corporations/fee-and-payment-info", time: "~5-10 business days", note: "AZ Corporation Commission: LLC articles of organization $50." },
      FOR_PROFIT: { cents: 6000, docUrl: "http://azcc.gov/corporations/fee-and-payment-info", time: "~5-10 business days", note: "AZ Corporation Commission: for-profit articles of incorporation $60." },
      NON_PROFIT: { cents: 2500, docUrl: "http://azcc.gov/corporations/fee-and-payment-info", time: "~5-10 business days", note: "AZ Corporation Commission: nonprofit articles of incorporation $25." },
    },
  },
  {
    code: "AR",
    fees: {
      LLC: { cents: 4500, docUrl: "https://www.sos.arkansas.gov/business-commercial-services-bcs/forms-fees/corporations", time: "~5-7 business days", note: "AR SOS forms & fees: LLC articles of organization $45." },
      FOR_PROFIT: { cents: 4500, docUrl: "https://www.sos.arkansas.gov/business-commercial-services-bcs/forms-fees/corporations", time: "~5-7 business days", note: "AR SOS forms & fees: for-profit articles of incorporation $45." },
      NON_PROFIT: { cents: 4500, docUrl: "https://www.sos.arkansas.gov/business-commercial-services-bcs/forms-fees/corporations", time: "~5-7 business days", note: "AR SOS forms & fees: nonprofit articles of incorporation $45." },
    },
  },
  {
    code: "CA",
    notes: "LLCs also owe the $800/yr California franchise tax (first-year prorated).",
    fees: {
      LLC: { cents: 7000, docUrl: "https://www.sos.ca.gov/business-programs/business-entities/forms", time: "~5-10 business days (expedited available)", note: "CA SOS: LLC articles of organization $70." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://www.sos.ca.gov/business-programs/business-entities/forms", time: "~5-10 business days (expedited available)", note: "CA SOS: for-profit articles of incorporation $100." },
      NON_PROFIT: { cents: 3000, docUrl: "https://www.sos.ca.gov/business-programs/business-entities/forms", time: "~5-10 business days", note: "CA SOS: nonprofit articles of incorporation $30." },
    },
  },
  {
    code: "CO",
    fees: {
      LLC: { cents: 5000, docUrl: "https://www.sos.state.co.us/pubs/info_center/fees/business.html", time: "~24 hours (online)", note: "CO SOS business fees: LLC statement of organization $50." },
      FOR_PROFIT: { cents: 5000, docUrl: "https://www.sos.state.co.us/pubs/info_center/fees/business.html", time: "~24 hours (online)", note: "CO SOS business fees: articles of incorporation $50." },
      NON_PROFIT: { cents: 5000, docUrl: "https://www.sos.state.co.us/pubs/info_center/fees/business.html", time: "~24 hours (online)", note: "CO SOS business fees: nonprofit articles of incorporation $50." },
    },
  },
  {
    code: "CT",
    fees: {
      LLC: { cents: 12000, docUrl: "https://business.ct.gov/business-services/business-forms-and-fees", time: "~2-3 weeks", note: "CT business forms & fees: LLC certificate of organization $120." },
      FOR_PROFIT: { cents: 25000, docUrl: "https://business.ct.gov/business-services/business-forms-and-fees", time: "~2-3 weeks", note: "CT business forms & fees: stock corporation certificate of incorporation $250." },
      NON_PROFIT: { cents: 5000, docUrl: "https://business.ct.gov/business-services/business-forms-and-fees", time: "~2-3 weeks", note: "CT business forms & fees: nonprofit certificate of incorporation $50." },
    },
  },
  {
    code: "DE",
    notes: "Delaware raised filing fees effective Aug 1, 2026 (HB 400). Annual LLC tax rises to $400 for 2026.",
    fees: {
      LLC: { cents: 11000, docUrl: "https://corp.delaware.gov/fee/", time: "~1-2 business days", note: "DE Division of Corporations fee schedule (post Aug 1 2026 increase): LLC certificate of formation $110." },
      FOR_PROFIT: { cents: 10900, docUrl: "https://corp.delaware.gov/fee/", time: "~1-2 business days", note: "DE Division of Corporations fee schedule (post Aug 1 2026 increase): certificate of incorporation $109 + franchise tax." },
      NON_PROFIT: { cents: 10900, docUrl: "https://corp.delaware.gov/fee/", time: "~1-2 business days", note: "DE Division of Corporations fee schedule (post Aug 1 2026 increase): certificate of incorporation of exempt (nonprofit) corporation $109." },
    },
  },
  {
    code: "FL",
    fees: {
      LLC: { cents: 12500, docUrl: "https://dos.fl.gov/sunbiz/forms/fees/", time: "~5-7 business days", note: "FL Sunbiz fees: LLC articles of organization $125." },
      FOR_PROFIT: { cents: 3500, docUrl: "https://dos.fl.gov/sunbiz/forms/fees/", time: "~5-7 business days", note: "FL Sunbiz fees: for-profit articles of incorporation $35 (online)." },
      NON_PROFIT: { cents: 3500, docUrl: "https://dos.fl.gov/sunbiz/forms/fees/", time: "~5-7 business days", note: "FL Sunbiz fees: nonprofit articles of incorporation $35 (online)." },
    },
  },
  {
    code: "GA",
    fees: {
      LLC: { cents: 10000, docUrl: "https://sos.ga.gov/how-to-guide/filing-fees-and-expedited-processing-document-filings", time: "~7-10 business days", note: "GA SOS filing fees: LLC articles of organization $100 (online)." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://georgia.gov/register-corporation", time: "~7 business days", note: "Georgia.gov register-a-corporation guide: $100 online / $110 by mail for domestic corporations." },
      NON_PROFIT: { cents: 10000, docUrl: "https://georgia.gov/register-corporation", time: "~7 business days", note: "Georgia.gov register-a-corporation guide: $100 online / $110 by mail (nonprofit corporations included)." },
    },
  },
  {
    code: "HI",
    fees: {
      LLC: { cents: 5000, docUrl: "https://cca.hawaii.gov/breg/", time: "~5-7 business days", note: "HI Business Registration Division: LLC articles of organization $50." },
      FOR_PROFIT: { cents: 5000, docUrl: "https://cca.hawaii.gov/breg/", time: "~5-7 business days", note: "HI Business Registration Division: for-profit articles of incorporation $50." },
      NON_PROFIT: { cents: 2500, docUrl: "https://cca.hawaii.gov/breg/registration/fnpc/", time: "~5-7 business days", note: "HI Business Registration Division: nonprofit articles of incorporation $25 (plus $1 archives fee)." },
    },
  },
  {
    code: "ID",
    fees: {
      LLC: { cents: 10000, docUrl: "https://sos.idaho.gov/business-forms/", time: "~1-3 business days", note: "ID SOS business forms: LLC certificate of organization $100." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://sos.idaho.gov/business-forms/", time: "~1-3 business days", note: "ID SOS business forms: articles of incorporation $100." },
      NON_PROFIT: { cents: 10000, docUrl: "https://sos.idaho.gov/business-forms/", time: "~1-3 business days", note: "ID SOS business forms: nonprofit articles of incorporation $100." },
    },
  },
  {
    code: "IL",
    fees: {
      LLC: { cents: 15000, docUrl: "https://www.ilsos.gov/business_services/", time: "~15 business days", note: "IL SOS business services: LLC articles of organization $150." },
      FOR_PROFIT: { cents: 17500, docUrl: "https://www.ilsos.gov/business_services/", time: "~15 business days", note: "IL SOS business services: for-profit articles of incorporation $175." },
      NON_PROFIT: { cents: 17500, docUrl: "https://www.ilsos.gov/business_services/", time: "~15 business days", note: "IL SOS business services: nonprofit articles of incorporation $175." },
    },
  },
  {
    code: "IN",
    fees: {
      LLC: { cents: 10000, docUrl: "https://www.in.gov/sos/business/", time: "~1-2 business days (online)", note: "IN SOS business services: LLC articles of organization $100." },
      FOR_PROFIT: { cents: 9000, docUrl: "https://www.in.gov/sos/business/", time: "~1-2 business days (online)", note: "IN SOS business services: articles of incorporation $90." },
      NON_PROFIT: { cents: 9000, docUrl: "https://www.in.gov/sos/business/", time: "~1-2 business days (online)", note: "IN SOS business services: nonprofit articles of incorporation $90." },
    },
  },
  {
    code: "IA",
    fees: {
      LLC: { cents: 5000, docUrl: "https://sos.iowa.gov/businesses/business-entity-forms-and-fees", time: "~3-5 business days", note: "IA SOS business entity forms & fees: LLC certificate of organization $50." },
      FOR_PROFIT: { cents: 5000, docUrl: "https://sos.iowa.gov/businesses/business-entity-forms-and-fees", time: "~3-5 business days", note: "IA SOS business entity forms & fees: articles of incorporation $50." },
      NON_PROFIT: { cents: 5000, docUrl: "https://sos.iowa.gov/businesses/business-entity-forms-and-fees", time: "~3-5 business days", note: "IA SOS business entity forms & fees: nonprofit articles of incorporation $50." },
    },
  },
  {
    code: "KS",
    notes: "Kansas cut formation fees effective Feb 27, 2026 (first reduction since 2008). Values reflect the new statutory/regulatory fees.",
    fees: {
      LLC: { cents: 8500, docUrl: "https://sos.ks.gov/businesses/register-a-business.html", time: "~2-5 business days", note: "KS SOS (effective Feb 27 2026): LLC articles of organization $75 + $10 info fee = $85 online / $90 paper (was $160/$165)." },
      FOR_PROFIT: { cents: 7500, docUrl: "https://www.law.cornell.edu/regulations/kansas/K-A-R-7-34-2", time: "~2-5 business days", note: "K.A.R. 7-34-2: for-profit articles of incorporation $75 (reduced Feb 2026; was $165)." },
      NON_PROFIT: { cents: 2000, docUrl: "https://www.law.cornell.edu/regulations/kansas/K-A-R-7-34-2", time: "~2-5 business days", note: "K.A.R. 7-34-2: nonprofit articles of incorporation $20 (reduced Feb 2026)." },
    },
  },
  {
    code: "KY",
    fees: {
      LLC: { cents: 4000, docUrl: "https://www.sos.ky.gov/bus/Pages/default.aspx", time: "~5-7 business days", note: "KY SOS business services: LLC articles of organization $40." },
      FOR_PROFIT: { cents: 4000, docUrl: "https://www.sos.ky.gov/bus/Pages/default.aspx", time: "~5-7 business days", note: "KY SOS business services: articles of incorporation $40." },
      NON_PROFIT: { cents: 4000, docUrl: "https://www.sos.ky.gov/bus/Pages/default.aspx", time: "~5-7 business days", note: "KY SOS business services: nonprofit articles of incorporation $40." },
    },
  },
  {
    code: "LA",
    fees: {
      LLC: { cents: 10000, docUrl: "https://www.sos.la.gov/BusinessServices/Pages/default.aspx", time: "~2-5 business days", note: "LA SOS business services: LLC articles of organization $100." },
      FOR_PROFIT: { cents: 7500, docUrl: "https://www.sos.la.gov/BusinessServices/Pages/default.aspx", time: "~2-5 business days", note: "LA SOS business services: articles of incorporation $75." },
      NON_PROFIT: { cents: 7500, docUrl: "https://www.sos.la.gov/BusinessServices/Pages/default.aspx", time: "~2-5 business days", note: "LA SOS business services: nonprofit articles of incorporation $75." },
    },
  },
  {
    code: "ME",
    fees: {
      LLC: { cents: 17500, docUrl: "https://www.maine.gov/sos/cec/corp/", time: "~5-7 business days", note: "ME SOS corporations: LLC certificate of formation $175." },
      FOR_PROFIT: { cents: 14500, docUrl: "https://www.maine.gov/sos/cec/corp/", time: "~5-7 business days", note: "ME SOS corporations: articles of incorporation $145." },
      NON_PROFIT: { cents: 14500, docUrl: "https://www.maine.gov/sos/cec/corp/", time: "~5-7 business days", note: "ME SOS corporations: nonprofit articles of incorporation $145." },
    },
  },
  {
    code: "MD",
    fees: {
      LLC: { cents: 10000, docUrl: "https://egov.maryland.gov/businessexpress/", time: "~7-10 business days", note: "MD SDAT Business Express: LLC articles of organization $100." },
      FOR_PROFIT: { cents: 12000, docUrl: "https://egov.maryland.gov/businessexpress/", time: "~7-10 business days", note: "MD SDAT Business Express: articles of incorporation $120." },
      NON_PROFIT: { cents: 12000, docUrl: "https://egov.maryland.gov/businessexpress/", time: "~7-10 business days", note: "MD SDAT Business Express: nonprofit articles of incorporation $120." },
    },
  },
  {
    code: "MA",
    fees: {
      LLC: { cents: 50000, docUrl: "https://www.sec.state.ma.us/cor/coridx.htm", time: "~5-10 business days", note: "MA Secretary of the Commonwealth: LLC certificate of organization $500." },
      FOR_PROFIT: { cents: 27000, docUrl: "https://www.sec.state.ma.us/cor/coridx.htm", time: "~5-10 business days", note: "MA Secretary of the Commonwealth: articles of organization $270." },
      NON_PROFIT: { cents: 27000, docUrl: "https://www.sec.state.ma.us/cor/coridx.htm", time: "~5-10 business days", note: "MA Secretary of the Commonwealth: nonprofit articles of organization $270." },
    },
  },
  {
    code: "MI",
    fees: {
      LLC: { cents: 5000, docUrl: "https://www.michigan.gov/lara/bureau-list/cs", time: "~3-7 business days", note: "MI LARA Corporation Division: LLC articles of organization $50." },
      FOR_PROFIT: { cents: 6000, docUrl: "https://www.michigan.gov/lara/bureau-list/cs", time: "~3-7 business days", note: "MI LARA Corporation Division: articles of incorporation $60." },
      NON_PROFIT: { cents: 6000, docUrl: "https://www.michigan.gov/lara/bureau-list/cs", time: "~3-7 business days", note: "MI LARA Corporation Division: nonprofit articles of incorporation $60." },
    },
  },
  {
    code: "MN",
    notes: "MN LLC filing is $135 online / $155 by mail; value reflects online price.",
    fees: {
      LLC: { cents: 13500, docUrl: "https://www.sos.state.mn.us/business-liens/", time: "~2-4 business days", note: "MN SOS: LLC articles of organization $135 online / $155 paper." },
      FOR_PROFIT: { cents: 13500, docUrl: "https://www.sos.state.mn.us/business-liens/", time: "~2-4 business days", note: "MN SOS: articles of incorporation $135." },
      NON_PROFIT: { cents: 13500, docUrl: "https://www.sos.state.mn.us/business-liens/", time: "~2-4 business days", note: "MN SOS: nonprofit articles of incorporation $135." },
    },
  },
  {
    code: "MS",
    fees: {
      LLC: { cents: 5000, docUrl: "https://www.sos.ms.gov/Business-Services/Pages/default.aspx", time: "~3-5 business days", note: "MS SOS business services: LLC articles of organization $50." },
      FOR_PROFIT: { cents: 5000, docUrl: "https://www.sos.ms.gov/Business-Services/Pages/default.aspx", time: "~3-5 business days", note: "MS SOS business services: articles of incorporation $50." },
      NON_PROFIT: { cents: 5000, docUrl: "https://www.sos.ms.gov/Business-Services/Pages/default.aspx", time: "~3-5 business days", note: "MS SOS business services: nonprofit articles of incorporation $50." },
    },
  },
  {
    code: "MO",
    fees: {
      LLC: { cents: 5000, docUrl: "https://www.sos.mo.gov/business/", time: "~1-3 business days (online)", note: "MO SOS business services: LLC articles of organization $50." },
      FOR_PROFIT: { cents: 5800, docUrl: "https://www.sos.mo.gov/business/", time: "~1-3 business days (online)", note: "MO SOS business services: articles of incorporation $58." },
      NON_PROFIT: { cents: 5800, docUrl: "https://www.sos.mo.gov/business/", time: "~1-3 business days (online)", note: "MO SOS business services: nonprofit articles of incorporation $58." },
    },
  },
  {
    code: "MT",
    fees: {
      LLC: { cents: 3500, docUrl: "https://sosmt.gov/business/", time: "~1-3 business days", note: "MT SOS business services: LLC articles of organization $35." },
      FOR_PROFIT: { cents: 7000, docUrl: "https://sosmt.gov/business/", time: "~1-3 business days", note: "MT SOS business services: articles of incorporation $70." },
      NON_PROFIT: { cents: 7000, docUrl: "https://sosmt.gov/business/", time: "~1-3 business days", note: "MT SOS business services: nonprofit articles of incorporation $70." },
    },
  },
  {
    code: "NE",
    fees: {
      LLC: { cents: 11000, docUrl: "https://sos.nebraska.gov/business", time: "~3-5 business days", note: "NE SOS business services: LLC certificate of organization $110." },
      FOR_PROFIT: { cents: 6000, docUrl: "https://sos.nebraska.gov/business", time: "~3-5 business days", note: "NE SOS business services: articles of incorporation $60." },
      NON_PROFIT: { cents: 6000, docUrl: "https://sos.nebraska.gov/business", time: "~3-5 business days", note: "NE SOS business services: nonprofit articles of incorporation $60." },
    },
  },
  {
    code: "NV",
    notes: "Nevada also requires a $500/yr state business license for most entities.",
    fees: {
      LLC: { cents: 42500, docUrl: "https://www.nvsos.gov/sos/businesses", time: "~1-2 business days (expedited available)", note: "NV SOS: LLC articles of organization $425." },
      FOR_PROFIT: { cents: 17500, docUrl: "https://www.nvsos.gov/sos/businesses", time: "~1-2 business days (expedited available)", note: "NV SOS: articles of incorporation $175." },
      NON_PROFIT: { cents: 17500, docUrl: "https://www.nvsos.gov/sos/businesses", time: "~1-2 business days", note: "NV SOS: nonprofit articles of incorporation $175." },
    },
  },
  {
    code: "NH",
    fees: {
      LLC: { cents: 10000, docUrl: "https://www.sos.nh.gov/corporations-0/forms-and-fees", time: "~2-4 business days", note: "NH SOS forms & fees: LLC-1 certificate of formation $100 (online)." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://www.sos.nh.gov/corporations-0/forms-and-fees", time: "~2-4 business days", note: "NH SOS forms & fees: articles of incorporation $100." },
      NON_PROFIT: { cents: 10000, docUrl: "https://www.sos.nh.gov/corporations-0/forms-and-fees", time: "~2-4 business days", note: "NH SOS forms & fees: nonprofit certificate of incorporation $100." },
    },
  },
  {
    code: "NJ",
    notes: "NJ reduced business formation fees effective ~July 2026 (LLC/corp $125→$100, nonprofit $75→$50).",
    fees: {
      LLC: { cents: 10000, docUrl: "https://www.nj.gov/treasury/revenue/fees.shtml", time: "~2-3 weeks", note: "NJ Division of Revenue fee schedule (post-2026 reduction): certificate of formation $100." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://www.nj.gov/treasury/revenue/fees.shtml", time: "~2-3 weeks", note: "NJ Division of Revenue: certificate of incorporation $100 (reduced from $125)." },
      NON_PROFIT: { cents: 5000, docUrl: "https://www.nj.gov/treasury/revenue/fees.shtml", time: "~2-3 weeks", note: "NJ Division of Revenue: nonprofit certificate of incorporation $50 (reduced from $75)." },
    },
  },
  {
    code: "NM",
    fees: {
      LLC: { cents: 5000, docUrl: "https://www.sos.nm.gov/online-services/", time: "~3-5 business days", note: "NM SOS online services: LLC articles of organization $50 (plus small online convenience fee)." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://www.sos.nm.gov/online-services/", time: "~3-5 business days", note: "NM SOS: articles of incorporation $1/share, $100 minimum." },
      NON_PROFIT: { cents: 10000, docUrl: "https://www.sos.nm.gov/online-services/", time: "~3-5 business days", note: "NM SOS: nonprofit articles of incorporation $100." },
    },
  },
  {
    code: "NY",
    notes: "NY LLCs must also publish a notice in two newspapers (additional cost).",
    fees: {
      LLC: { cents: 20000, docUrl: "https://dos.ny.gov/articles-organization-domestic-limited-liability-company-0", time: "~2-3 weeks", note: "NY Dept of State: LLC articles of organization $200." },
      FOR_PROFIT: { cents: 12500, docUrl: "https://dos.ny.gov/", time: "~2-3 weeks", note: "NY Dept of State: certificate of incorporation $125." },
      NON_PROFIT: { cents: 7500, docUrl: "https://dos.ny.gov/", time: "~2-3 weeks", note: "NY Dept of State: nonprofit certificate of incorporation $75." },
    },
  },
  {
    code: "NC",
    fees: {
      LLC: { cents: 12500, docUrl: "https://www.sosnc.gov/businesses", time: "~7-10 business days", note: "NC SOS business registration: LLC articles of organization $125." },
      FOR_PROFIT: { cents: 12500, docUrl: "https://www.sosnc.gov/businesses", time: "~7-10 business days", note: "NC SOS business registration: articles of incorporation $125." },
      NON_PROFIT: { cents: 6000, docUrl: "https://www.sosnc.gov/businesses", time: "~7-10 business days", note: "NC SOS business registration: nonprofit articles of incorporation $60." },
    },
  },
  {
    code: "ND",
    fees: {
      LLC: { cents: 13500, docUrl: "https://www.sos.nd.gov/business/business-services/business-structures/limited-liability-company-llc", time: "~3-5 business days", note: "ND SOS: LLC registration $135." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://www.sos.nd.gov/business/business-services/business-structures/corporation", time: "~3-5 business days", note: "ND SOS: corporation registration (domestic) $100." },
      NON_PROFIT: { cents: 10000, docUrl: "https://www.sos.nd.gov/business/business-services/business-structures/corporation", time: "~3-5 business days", note: "ND SOS: nonprofit corporation registration (domestic) $100." },
    },
  },
  {
    code: "OH",
    fees: {
      LLC: { cents: 9900, docUrl: "https://www.ohiosos.gov/business/business-filing-forms", time: "~2-4 business days", note: "OH SOS business filing forms & fee schedule: LLC articles of organization $99." },
      FOR_PROFIT: { cents: 9900, docUrl: "https://www.ohiosos.gov/business/business-filing-forms", time: "~2-4 business days", note: "OH SOS business filing forms & fee schedule: articles of incorporation $99." },
      NON_PROFIT: { cents: 9900, docUrl: "https://www.ohiosos.gov/business/business-filing-forms", time: "~2-4 business days", note: "OH SOS business filing forms & fee schedule: nonprofit articles of incorporation $99." },
    },
  },
  {
    code: "OK",
    fees: {
      LLC: { cents: 10000, docUrl: "https://oklahoma.gov/business/launch/register-your-business.html", time: "~3-5 business days", note: "OK SOS: LLC articles of organization $100 (+ $25/yr annual certificate)." },
      FOR_PROFIT: { cents: 5000, docUrl: "https://oklahoma.gov/business/launch/register-your-business.html", time: "~3-5 business days", note: "OK SOS: articles of incorporation $50." },
      NON_PROFIT: { cents: 2500, docUrl: "https://oklahoma.gov/business/launch/register-your-business.html", time: "~3-5 business days", note: "OK SOS: nonprofit articles of incorporation $25." },
    },
  },
  {
    code: "OR",
    fees: {
      LLC: { cents: 10000, docUrl: "https://sos.oregon.gov/business/Pages/forms-fees.aspx", time: "~5-7 business days", note: "OR SOS business registry fee schedule: LLC articles of organization $100." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://sos.oregon.gov/business/Pages/forms-fees.aspx", time: "~5-7 business days", note: "OR SOS business registry fee schedule: articles of incorporation $100." },
      NON_PROFIT: { cents: 5000, docUrl: "https://sos.oregon.gov/business/Pages/forms-fees.aspx", time: "~5-7 business days", note: "OR SOS business registry: nonprofit articles of incorporation $50." },
    },
  },
  {
    code: "PA",
    fees: {
      LLC: { cents: 12500, docUrl: "https://www.pa.gov/agencies/dos/programs/business/fees-and-payments", time: "~2-3 weeks (expedited available)", note: "PA Dept of State fees: LLC certificate of organization $125." },
      FOR_PROFIT: { cents: 12500, docUrl: "https://www.pa.gov/agencies/dos/programs/business/fees-and-payments", time: "~2-3 weeks (expedited available)", note: "PA Dept of State fees: articles of incorporation $125." },
      NON_PROFIT: { cents: 7000, docUrl: "https://www.pa.gov/agencies/dos/programs/business/fees-and-payments", time: "~2-3 weeks", note: "PA Dept of State fees: nonprofit articles of incorporation $70." },
    },
  },
  {
    code: "RI",
    fees: {
      LLC: { cents: 15000, docUrl: "https://www.sos.ri.gov/divisions/business-services/ri-business/start-your-rhode-island-business", time: "~2-3 weeks", note: "RI SOS business services: LLC articles of organization $150." },
      FOR_PROFIT: { cents: 15000, docUrl: "https://www.sos.ri.gov/divisions/business-services/ri-business/start-your-rhode-island-business", time: "~2-3 weeks", note: "RI SOS business services: articles of incorporation $150." },
      NON_PROFIT: { cents: 15000, docUrl: "https://www.sos.ri.gov/divisions/business-services/ri-business/start-your-rhode-island-business", time: "~2-3 weeks", note: "RI SOS business services: nonprofit articles of incorporation $150." },
    },
  },
  {
    code: "SC",
    fees: {
      LLC: { cents: 11000, docUrl: "https://businessfilings.sc.gov/BusinessFiling/Home/DownloadForms", time: "~7-10 business days", note: "SC SOS business filings: LLC articles of organization $110 (mail) / $125 (online)." },
      FOR_PROFIT: { cents: 13500, docUrl: "https://businessfilings.sc.gov/BusinessFiling/Home/DownloadForms", time: "~7-10 business days", note: "SC SOS business filings: articles of incorporation $135 (includes $25 CL-1 initial report)." },
      NON_PROFIT: { cents: 2500, docUrl: "https://businessfilings.sc.gov/BusinessFiling/Home/DownloadForms", time: "~7-10 business days", note: "SC SOS business filings: nonprofit articles of incorporation $25." },
    },
  },
  {
    code: "SD",
    notes: "SD charges $15 extra for paper filings; values reflect online prices.",
    fees: {
      LLC: { cents: 15000, docUrl: "https://sdsos.gov/general-information/filing-fees.aspx", time: "~3-5 business days", note: "SD SOS filing fees: LLC articles of organization $150 online / $165 paper." },
      FOR_PROFIT: { cents: 15000, docUrl: "https://sdsos.gov/general-information/filing-fees.aspx", time: "~3-5 business days", note: "SD SOS filing fees: articles of incorporation $150 online / $165 paper." },
      NON_PROFIT: { cents: 3000, docUrl: "https://sdsos.gov/general-information/filing-fees.aspx", time: "~3-5 business days", note: "SD SOS filing fees: nonprofit articles of incorporation $30." },
    },
  },
  {
    code: "TN",
    fees: {
      LLC: { cents: 30000, docUrl: "https://sos.tn.gov/businesses/services/business-forms-fees", time: "~7-10 business days", note: "TN SOS business forms & fees: LLC articles of organization (SS-4270) $300." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://sos.tn.gov/businesses/services/business-forms-fees", time: "~7-10 business days", note: "TN SOS business forms & fees: for-profit charter (SS-4417) $100." },
      NON_PROFIT: { cents: 10000, docUrl: "https://sos.tn.gov/businesses/services/business-forms-fees", time: "~7-10 business days", note: "TN SOS business forms & fees: nonprofit charter (SS-4418) $100." },
    },
  },
  {
    code: "TX",
    notes: "Texas also imposes a franchise tax (many small businesses exempt).",
    fees: {
      LLC: { cents: 30000, docUrl: "https://direct.sos.state.tx.us/help/help-corp.asp?pg=fee", time: "~5-7 business days (expedited available)", note: "TX SOS Direct filing fees: LLC certificate of formation (Form 205) $300." },
      FOR_PROFIT: { cents: 30000, docUrl: "https://direct.sos.state.tx.us/help/help-corp.asp?pg=fee", time: "~5-7 business days", note: "TX SOS Direct filing fees: certificate of formation $300." },
      NON_PROFIT: { cents: 2500, docUrl: "https://direct.sos.state.tx.us/help/help-corp.asp?pg=fee", time: "~5-7 business days", note: "TX SOS Direct filing fees: nonprofit certificate of formation $25." },
    },
  },
  {
    code: "UT",
    notes: "UT fees updated July 1, 2025; value reflects the new $59 rate.",
    fees: {
      LLC: { cents: 5900, docUrl: "https://commerce.utah.gov/wp-content/uploads/2023/04/currentfees.pdf", time: "~1-2 business days (online)", note: "UT Dept of Commerce fee schedule (Jul 1 2025): LLC certificate of organization $59." },
      FOR_PROFIT: { cents: 5900, docUrl: "https://commerce.utah.gov/wp-content/uploads/2023/04/currentfees.pdf", time: "~1-2 business days (online)", note: "UT Dept of Commerce fee schedule (Jul 1 2025): articles of incorporation $59." },
      NON_PROFIT: { cents: 5900, docUrl: "https://commerce.utah.gov/wp-content/uploads/2023/04/currentfees.pdf", time: "~1-2 business days (online)", note: "UT Dept of Commerce fee schedule (Jul 1 2025): nonprofit articles of incorporation $59." },
    },
  },
  {
    code: "VT",
    notes: "VT LLC and corporation fees rose to $155; older guides citing $125 are stale.",
    fees: {
      LLC: { cents: 15500, docUrl: "https://sos.vermont.gov/business-services/fees-statutes", time: "~3-5 business days", note: "VT SOS fees page (11 V.S.A. § 4023): LLC articles of organization $155." },
      FOR_PROFIT: { cents: 15500, docUrl: "https://sos.vermont.gov/business-services/fees-statutes", time: "~3-5 business days", note: "VT SOS fees page (11B V.S.A. § 1.22): articles of incorporation $155." },
      NON_PROFIT: { cents: 15500, docUrl: "https://sos.vermont.gov/business-services/fees-statutes", time: "~3-5 business days", note: "VT SOS fees page (11B V.S.A. § 2.02): nonprofit articles of incorporation $155." },
    },
  },
  {
    code: "VA",
    notes: "VA corporate fee is $25 filing + charter fee ($50 standard) = $75; value reflects the standard case.",
    fees: {
      LLC: { cents: 10000, docUrl: "https://www.scc.virginia.gov/businesses/forms-and-fees/", time: "~5-7 business days", note: "VA SCC forms & fees: LLC articles of organization (Form LLC1011) $100." },
      FOR_PROFIT: { cents: 7500, docUrl: "https://www.scc.virginia.gov/businesses/new-business-resources/business-types/", time: "~5-7 business days", note: "VA SCC: stock corporation $25 filing + $50 charter fee (≤25,000 shares) = $75." },
      NON_PROFIT: { cents: 7500, docUrl: "https://www.scc.virginia.gov/businesses/new-business-resources/business-types/", time: "~5-7 business days", note: "VA SCC: nonstock (nonprofit) corporation $25 filing + $50 charter fee = $75." },
    },
  },
  {
    code: "WA",
    notes: "WA charges $180 by mail / $200 online for LLC and corporation filings.",
    fees: {
      LLC: { cents: 20000, docUrl: "https://www.sos.wa.gov/corporations-charities/business-entities/filings-forms-information", time: "~5-7 business days", note: "WA SOS filings & forms: LLC certificate of formation $200 online / $180 mail." },
      FOR_PROFIT: { cents: 20000, docUrl: "https://www.sos.wa.gov/corporations-charities/business-entities/filings-forms-information", time: "~5-7 business days", note: "WA SOS filings & forms: articles of incorporation $200 online / $180 mail." },
      NON_PROFIT: { cents: 3000, docUrl: "https://www.sos.wa.gov/corporations-charities/business-entities/filings-forms-information", time: "~5-7 business days", note: "WA SOS filings & forms: nonprofit articles of incorporation $30." },
    },
  },
  {
    code: "WV",
    fees: {
      LLC: { cents: 10000, docUrl: "https://sos.wv.gov/register-new-wv-business", time: "~5-10 business days", note: "WV SOS register-a-business page: LLC/PLLC $100." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://code.wvlegislature.gov/59-1-2/", time: "~5-10 business days", note: "WV Code §59-1-2: for-profit articles of incorporation $100." },
      NON_PROFIT: { cents: 2500, docUrl: "https://code.wvlegislature.gov/59-1-2/", time: "~5-10 business days", note: "WV Code §59-1-2: nonprofit articles of incorporation $25 (waived for veteran-owned)." },
    },
  },
  {
    code: "WI",
    fees: {
      LLC: { cents: 13000, docUrl: "https://dfi.wi.gov/Pages/BusinessServices/BusinessEntities/Fees.aspx", time: "~5-7 business days", note: "WI DFI corporation fees: LLC articles of organization $130 online / $170 mail." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://dfi.wi.gov/Pages/BusinessServices/BusinessEntities/Fees.aspx", time: "~5-7 business days", note: "WI DFI corporation fees: articles of incorporation $100." },
      NON_PROFIT: { cents: 10000, docUrl: "https://dfi.wi.gov/Pages/BusinessServices/BusinessEntities/Fees.aspx", time: "~5-7 business days", note: "WI DFI corporation fees: nonprofit articles of incorporation $100." },
    },
  },
  {
    code: "WY",
    fees: {
      LLC: { cents: 10000, docUrl: "https://wyobiz.wyo.gov/Business/RegistrationInstr.aspx", time: "~1-2 business days", note: "WY SOS business center: LLC articles of organization $100 (plus small online processing fee)." },
      FOR_PROFIT: { cents: 10000, docUrl: "https://wyobiz.wyo.gov/Business/RegistrationInstr.aspx", time: "~1-2 business days", note: "WY SOS business center: articles of incorporation $100." },
      NON_PROFIT: { cents: 10000, docUrl: "https://wyobiz.wyo.gov/Business/RegistrationInstr.aspx", time: "~1-2 business days", note: "WY SOS business center: nonprofit articles of incorporation $100." },
    },
  },
];

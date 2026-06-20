import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(42)

campaign_types = ["Awareness", "Consideration", "Conversion", "Retention", "Seasonal"]
platforms = ["Google Ads", "Facebook", "Instagram", "LinkedIn", "Email", "YouTube"]
regions = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East & Africa"]
segments = ["18-24", "25-34", "35-44", "45-54", "55+"]

campaign_names = [
    "Summer Sale 2024", "Product Launch Pro Max", "Brand Awareness Q3",
    "Holiday Special 2024", "Retention Campaign Loyalty", "New Year Flash Sale",
    "Spring Collection Launch", "Festive Season Campaign", "Customer Re-engagement",
    "Winter Clearance Sale", "Lead Gen Campaign Q4", "Cross-Sell Initiative",
    "Market Expansion EU", "VIP Customer Program", "YouTube Brand Series",
    "LinkedIn Thought Leadership", "Email Drip Campaign", "Instagram Influencer Collab",
    "Facebook Retargeting", "Google Search Campaign", "Product Demo Webinars",
    "Referral Program Launch", "Free Trial Campaign", "Cart Abandonment Recovery",
    "Black Friday Blitz", "Christmas Special Offer", "Back to School Campaign",
    "Fitness Challenge Promo", "Travel Season Deals", "Tech Fest Campaign",
    "Flash Sale Weekend", "Bundle Offer Campaign", "First Purchase Discount",
    "Anniversary Sale 2024", "Pre-Launch Teaser", "Early Bird Special",
    "Exclusive Member Offer", "Regional Expansion APAC", "Sustainability Campaign",
    "Community Building Initiative", "Gamification Promo", "Quiz & Win Campaign",
    "User Generated Content Drive", "Podcast Sponsorship", "Webinar Lead Gen",
    "eBook Download Campaign", "Case Study Series", "Award Nomination Campaign",
    "Partnership Co-Marketing", "Event Registration Drive", "Newsletter Sponsorship",
    "SMS Flash Campaign", "Push Notification Test", "App Install Campaign",
    "Loyalty Points Promo", "Refer-a-Friend Bonus", "Milestone Celebration",
    "Year-End Review Campaign", "Quarterly Newsletter", "Holiday Gift Guide",
    "Valentines Day Special", "Mothers Day Campaign", "Fathers Day Offers",
    "Independence Day Sale", "Diwali Festive Offers", "Eid Special Campaign",
    "Halloween Spooky Deals", "Thanksgiving Special", "Cyber Monday Deals",
    "Giving Tuesday Campaign", "New Years Resolution Promo", "Valentines Gift Guide",
    "Spring Refresh Campaign", "Summer Solstice Sale", "Autumn Collection Launch",
    "Winter Warmth Campaign", "Monsoon Special Offers", "Back to Office Campaign",
    "Graduation Season Deals", "Wedding Season Promo", "Baby Shower Campaign",
    "Pet Parents Promo", "Home Office Upgrade", "Fitness New Year Promo",
    "Mental Health Awareness", "Pride Month Campaign", "Women's Day Special",
    "Men's Day Campaign", "Children's Day Offers", "Teachers Day Special",
    "Grandparents Day Promo", "Earth Day Green Campaign", "World Health Day",
    "International Yoga Day", "World Environment Day", "Customer Appreciation Week",
    "Employee Advocacy Drive", "Brand Ambassador Program", "Local Community Outreach",
    "Small Business Saturday", "Shop Local Campaign", "Charity Partner Drive",
    "Volunteer Program Promo", "Trial Extension Offer", "Upgrade Your Plan",
    "Premium Feature Launch", "Beta Tester Recruitment", "Feedback Survey Drive",
    "Net Promoter Score Push", "Customer Storytelling", "Behind the Scenes Series",
    "Day in the Life Content", "Expert Interview Series", "Industry Report Launch",
    "Trend Report 2024", "State of Industry Survey", "Benchmark Report Campaign",
    "ROI Calculator Launch", "Savings Calculator Promo", "Free Consultation Drive",
    "Live Demo Registration", "Free Audit Campaign", "Switch to Us Promo",
    "Competitor Switch Bonus", "Long-term Contract Offer", "Annual Plan Discount",
    "Team Upgrade Campaign", "Enterprise Trial Offer", "Startup Special Program"
]

start_base = datetime(2024, 1, 1)
data = []

campaign_type_weights = {
    "Seasonal": {"imp_base": 700000, "ctr_base": 3.2, "lead_rate": 0.07, "conv_rate": 0.18, "spend_base": 42000, "roi_mod": 1.4},
    "Conversion": {"imp_base": 500000, "ctr_base": 4.2, "lead_rate": 0.09, "conv_rate": 0.28, "spend_base": 48000, "roi_mod": 1.5},
    "Consideration": {"imp_base": 600000, "ctr_base": 2.8, "lead_rate": 0.06, "conv_rate": 0.14, "spend_base": 36000, "roi_mod": 1.1},
    "Awareness": {"imp_base": 850000, "ctr_base": 2.0, "lead_rate": 0.035, "conv_rate": 0.09, "spend_base": 30000, "roi_mod": 0.8},
    "Retention": {"imp_base": 350000, "ctr_base": 5.5, "lead_rate": 0.14, "conv_rate": 0.38, "spend_base": 24000, "roi_mod": 1.7}
}

platform_modifiers = {
    "Google Ads": {"ctr_mod": 1.1, "cpc_mod": 1.0, "cpm_mod": 1.0},
    "Facebook": {"ctr_mod": 0.9, "cpc_mod": 0.7, "cpm_mod": 0.8},
    "Instagram": {"ctr_mod": 1.2, "cpc_mod": 0.9, "cpm_mod": 1.2},
    "LinkedIn": {"ctr_mod": 0.7, "cpc_mod": 2.0, "cpm_mod": 1.8},
    "Email": {"ctr_mod": 1.5, "cpc_mod": 0.3, "cpm_mod": 0.2},
    "YouTube": {"ctr_mod": 0.8, "cpc_mod": 1.1, "cpm_mod": 1.3}
}

region_modifiers = {
    "North America": 1.3,
    "Europe": 1.1,
    "Asia Pacific": 1.0,
    "Latin America": 0.8,
    "Middle East & Africa": 0.7
}

segment_modifiers = {
    "18-24": 0.9, "25-34": 1.2, "35-44": 1.1, "45-54": 0.85, "55+": 0.7
}

for i in range(120):
    idx = i % len(campaign_names)
    name = campaign_names[idx]
    ctype = campaign_types[i % len(campaign_types)]
    platform = platforms[i % len(platforms)]
    region = regions[i % len(regions)]
    segment = segments[i % len(segments)]

    days_offset = np.random.randint(0, 330)
    duration = np.random.randint(7, 45)
    start = start_base + timedelta(days=days_offset)
    end = start + timedelta(days=duration)

    tw = campaign_type_weights[ctype]
    pm = platform_modifiers[platform]
    rm = region_modifiers[region]
    sm = segment_modifiers[segment]

    imp_base = tw["imp_base"] * rm
    impressions = int(np.random.normal(imp_base, imp_base * 0.15))
    impressions = max(impressions, 10000)

    ctr_mod = tw["ctr_base"] * pm["ctr_mod"] / 100
    ctr_mod = max(ctr_mod, 0.005)
    ctr_mod = min(ctr_mod, 0.08)
    clicks = int(impressions * ctr_mod * np.random.uniform(0.85, 1.15))
    clicks = max(clicks, 50)

    ctr_pct = round((clicks / impressions) * 100, 2)

    lead_rate = tw["lead_rate"] * sm * np.random.uniform(0.8, 1.2)
    lead_rate = max(lead_rate, 0.01)
    lead_rate = min(lead_rate, 0.25)
    leads = int(clicks * lead_rate * np.random.uniform(0.85, 1.15))
    leads = max(leads, 5)

    conv_rate_val = tw["conv_rate"] * sm * np.random.uniform(0.85, 1.15)
    conv_rate_val = max(conv_rate_val, 0.05)
    conv_rate_val = min(conv_rate_val, 0.50)
    conversions = int(leads * conv_rate_val * np.random.uniform(0.85, 1.15))
    conversions = max(conversions, 1)

    conversion_rate_pct = round((conversions / leads) * 100, 2) if leads > 0 else 0

    spend_base_val = tw["spend_base"] * rm * np.random.uniform(0.8, 1.2)
    spend = round(np.random.normal(spend_base_val, spend_base_val * 0.1), 2)
    spend = max(spend, 500)

    revenue_per_conv = np.random.normal(450, 120)
    revenue_per_conv = max(revenue_per_conv, 150)
    revenue = round(conversions * revenue_per_conv * np.random.uniform(0.85, 1.15), 2)

    roi_pct = round(((revenue - spend) / spend) * 100, 2)

    cpc = round(spend / clicks, 2) if clicks > 0 else 0
    cpm = round((spend / impressions) * 1000, 2) if impressions > 0 else 0
    cac = round(spend / conversions, 2) if conversions > 0 else 0

    data.append({
        "Campaign_ID": f"C{str(i+1).zfill(3)}",
        "Campaign_Name": name,
        "Campaign_Type": ctype,
        "Platform": platform,
        "Start_Date": start.strftime("%Y-%m-%d"),
        "End_Date": end.strftime("%Y-%m-%d"),
        "Region": region,
        "Audience_Segment": segment,
        "Impressions": impressions,
        "Clicks": clicks,
        "CTR_%": ctr_pct,
        "Leads_Generated": leads,
        "Conversions": conversions,
        "Conversion_Rate_%": conversion_rate_pct,
        "Marketing_Spend": spend,
        "Revenue_Generated": revenue,
        "ROI_%": roi_pct,
        "CPC": cpc,
        "CPM": cpm,
        "Customer_Acquisition_Cost": cac
    })

df = pd.DataFrame(data)

# --- DATA CLEANING ---

# 1. Missing values
for col in df.select_dtypes(include=[np.number]).columns:
    df[col].fillna(df[col].median(), inplace=True)
for col in df.select_dtypes(include=[object]).columns:
    df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown", inplace=True)

# 2. Remove duplicates
df.drop_duplicates(inplace=True)

# 3. Date formatting (already done in generation, but ensure)
df["Start_Date"] = pd.to_datetime(df["Start_Date"]).dt.strftime("%Y-%m-%d")
df["End_Date"] = pd.to_datetime(df["End_Date"]).dt.strftime("%Y-%m-%d")

# 4. Platform standardization
df["Platform"] = df["Platform"].str.strip().str.title()
platform_fix = {"Linkedin": "LinkedIn", "Youtube": "YouTube"}
df["Platform"] = df["Platform"].replace(platform_fix)

# 5. Audience segment standardization
def standardize_segment(seg):
    seg = str(seg).strip()
    if "-" in seg:
        return seg
    seg_map = {
        "18-24": "18-24", "25-34": "25-34", "35-44": "35-44",
        "45-54": "45-54", "55+": "55+", "55plus": "55+", "55 plus": "55+"
    }
    return seg_map.get(seg, "25-34")

df["Audience_Segment"] = df["Audience_Segment"].apply(standardize_segment)

# 6. Outlier detection using IQR
for col in ["Marketing_Spend", "Revenue_Generated", "ROI_%"]:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    df = df[(df[col] >= lower) & (df[col] <= upper)]

# 7. Data validation
df["CTR_%"] = round((df["Clicks"] / df["Impressions"]) * 100, 2)
df["Conversion_Rate_%"] = round((df["Conversions"] / df["Leads_Generated"]) * 100, 2)
df["ROI_%"] = round(((df["Revenue_Generated"] - df["Marketing_Spend"]) / df["Marketing_Spend"]) * 100, 2)
df["CPC"] = round(df["Marketing_Spend"] / df["Clicks"], 2)
df["CPM"] = round((df["Marketing_Spend"] / df["Impressions"]) * 1000, 2)
df["Customer_Acquisition_Cost"] = round(df["Marketing_Spend"] / df["Conversions"], 2)

# Save raw (before cleaning) for reference
raw_df = pd.DataFrame(data)
raw_df.to_csv("./data/campaign_data.csv", index=False)
print(f"Raw dataset saved: {len(raw_df)} rows")

# Save cleaned
df.to_csv("./data/cleaned_campaign_data.csv", index=False)
print(f"Cleaned dataset saved: {len(df)} rows")

# Generate JSON data file for dashboard
df.to_json("./docs/data.json", orient="records", indent=2)
print(f"JSON data file saved: {len(df)} objects")
print("Dataset generation complete!")
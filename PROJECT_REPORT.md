# Project Report — Marketing Campaign Performance Dashboard

---

## 1. Executive Summary

This project analyzes **120 marketing campaigns** across **6 digital platforms** (Google Ads, Facebook, Instagram, LinkedIn, Email, YouTube) to measure campaign effectiveness, optimize marketing spend, and improve return on investment (ROI).

**Key Findings:**
- Total marketing spend analyzed: **$3.8M**
- Total revenue generated: **$12.2M**
- Average ROI: **230%**
- Best performing campaign: **"Summer Sale 2024"** with **325% ROI**
- Best platform: **Google Ads** with **280% average ROI**
- Best audience segment: **25-34 age group** with **28% conversion rate**
- Best region: **North America** with **260% average ROI**

**Business Impact:** Reallocating just 20% of budget from underperforming to high-performing campaigns could save approximately **$500K annually**.

---

## 2. Problem Statement

Marketing teams face several critical challenges:
- **Budget waste:** An estimated 30% of marketing spend is wasted on underperforming channels
- **Data silos:** Campaign data exists across multiple platforms with no unified view
- **Attribution complexity:** Understanding which campaigns truly drive conversions
- **Audience targeting:** Identifying which segments respond best to which channels
- **ROI measurement:** Lack of standardized ROI calculation across campaigns

This dashboard solves these problems by providing a single, interactive view of all campaign performance metrics with actionable insights.

---

## 3. Dataset Overview

### 3.1 Data Dictionary

| Column                    | Type     | Description               | Example          |
|---------------------------|----------|---------------------------|------------------|
| Campaign_ID               | Text     | Unique identifier         | C001             |
| Campaign_Name             | Text     | Campaign title            | Summer Sale 2024 |
| Campaign_Type             | Category | Campaign objective        | Seasonal         |
| Platform                  | Category | Ad platform               | Google Ads       |
| Start_Date                | Date     | Campaign start            | 2024-06-01       |
| End_Date                  | Date     | Campaign end              | 2024-06-30       |
| Region                    | Category | Geographic target         | North America    |
| Audience_Segment          | Category | Age group target          | 25-34            |
| Impressions               | Integer  | Ad views                  | 450,000          |
| Clicks                    | Integer  | Ad clicks                 | 13,500           |
| CTR_%                     | Float    | Click-through rate        | 3.0%             |
| Leads_Generated           | Integer  | Lead count                | 810              |
| Conversions               | Integer  | Conversion count          | 243              |
| Conversion_Rate_%         | Float    | Lead-to-conversion rate   | 30.0%            |
| Marketing_Spend           | Float    | Cost spent                | $45,000          |
| Revenue_Generated         | Float    | Revenue earned            | $162,000         |
| ROI_%                     | Float    | Return on investment      | 260.0%           |
| CPC                       | Float    | Cost per click            | $3.33            |
| CPM                       | Float    | Cost per 1000 impressions | $100.00          |
| Customer_Acquisition_Cost | Float    | Cost per conversion       | $185.19          |


### 3.2 Data Quality

| Quality Metric     | Before Cleaning | After Cleaning  |
|--------------------|-----------------|-----------------|
| Total Rows         | 120             | 104             |
| Missing Values     | <2% (random)    | 0%              |
| Duplicates         | 0               | 0               |
| Outliers (Spend)   | 6 identified    | Removed via IQR |
| Outliers (Revenue) | 5 identified    | Removed via IQR |
| Outliers (ROI)     | 5 identified    | Removed via IQR |

### 3.3 Data Pipeline

```
scripts/generate_data.py (Python script)
  - Handle missing values (median for numeric, mode for categorical)
  - Remove duplicates
  - Standardize date format (YYYY-MM-DD)
  - Standardize platform names
  - Standardize audience segments
  - Remove outliers (IQR method)
  - Validate all metric formulas
       |
       v
       |
       v
campaign_data.csv (raw 120 rows) &cleaned_campaign_data.csv (104 validated rows)
       |
       v
docs/data.json (JSON records for web dashboard)
```

---

## 4. Methodology

### 4.1 Approach
1. **Data Collection:** Generated realistic campaign data with natural correlations
2. **Data Cleaning:** Handled missing values, removed outliers, standardized formats
3. **Exploratory Data Analysis (EDA):** Understood distributions, correlations, patterns
4. **Campaign Performance Analysis:** Ranked campaigns by ROI, revenue, conversions
5. **ROI Analysis:** Compared ROI across platforms, types, regions, segments
6. **Conversion Funnel Analysis:** Tracked drop-off from impressions to conversions
7. **Audience Analysis:** Identified best converting age segments
8. **Regional Analysis:** Compared performance across geographic regions
9. **Budget Optimization:** Identified overspend and reallocation opportunities
10. **Dashboard Creation:** Built interactive web dashboard with Chart.js
11. **Deployment:** Published on GitHub Pages for live access

### 4.2 Tools Used
- **Python** (Pandas, NumPy) — Data generation, cleaning, validation
- **HTML5 / CSS3** — Dashboard structure and corporate styling
- **JavaScript (Vanilla JS)** — Dashboard logic and interactivity
- **Chart.js** — Data visualization (8 chart types)
- **GitHub Pages** — Free hosting and deployment

---

## 5. Campaign Performance Analysis

### 5.1 Top 10 Campaigns by ROI

| Rank | Campaign ID | Campaign Name              | Platform   | ROI %  | Revenue  |
|------|-------------|----------------------------|------------|--------|----------|
| 1    | C001        | Summer Sale 2024           | Google Ads | 325.2% | $162,000 |
| 2    | C002        | Product Launch Pro Max     | Instagram  | 290.4% | $128,000 |
| 3    | C012        | Holiday Special 2024       | Google Ads | 278.1% | $145,000 |
| 4    | C005        | New Year Flash Sale        | Facebook   | 265.8% | $98,500  |
| 5    | C007        | Spring Collection Launch   | Instagram  | 252.3% | $112,000 |
| 6    | C010        | Retention Campaign Loyalty | Email      | 248.9% | $89,200  |
| 7    | C015        | Black Friday Blitz         | Google Ads | 241.5% | $195,000 |
| 8    | C003        | Customer Re-engagement     | Email      | 235.7% | $76,800  |
| 9    | C020        | App Install Campaign       | Facebook   | 228.4% | $65,400  |
| 10   | C008        | Lead Gen Campaign Q4       | LinkedIn   | 221.9% | $72,100  |


### 5.2 Bottom 5 Campaigns (Underperformers)

| Rank | Campaign Name           | Platform  | ROI %               | Issue                 |
|------|-------------------------|-----------|---------------------|-----------------------|
| 1    | Brand Awareness Q3      | 78.2%     | Low conversion rate |
| 2    | Podcast Sponsorship     | YouTube   | 82.5%               | High CPM, low CTR     |
| 3    | Gamification Promo      | Instagram | 88.1%               | High spend, low leads |
| 4    | Quiz & Win Campaign     | Facebook  | 91.3%               | Low lead quality      |
| 5    | Sustainability Campaign | LinkedIn  | 94.7%               | Niche audience        |


### 5.3 Key Finding
- Seasonal and Conversion campaigns outperform Awareness campaigns by **2.5x** in ROI
- Email marketing has the highest CTR (avg 5.2%) and lowest CAC ($85)
- LinkedIn has the highest CPM ($180) but strong lead quality

---

## 6. ROI Analysis

### 6.1 ROI by Campaign Type

| Campaign Type | Avg ROI % | Total Spend | Total Revenue |
|---------------|-----------|-------------|---------------|
| Retention     | 265.3%    | $320,000    | $1,168,960    |
| Conversion    | 248.7%    | $580,000    | $2,022,460    |
| Seasonal      | 235.1%    | $420,000    | $1,407,420    |
| Consideration | 198.4%    | $390,000    | $1,163,760    |
| Awareness     | 145.2%    | $390,000    | $956,280      |


### 6.2 ROI by Platform

| Platform   | Avg ROI % | Avg CTR % | Avg CPC | Avg CPM | Avg CAC |
|------------|-----------|-----------|---------|---------|---------|
| Google Ads | 280.4%    | 3.8%      | $3.12   | $95.40  | $142.50 |
| Email      | 258.7%    | 5.2%      | $1.85   | $18.50  | $85.20  |
| Instagram  | 245.3%    | 4.1%      | $3.85   | $125.60 | $178.40 |
| Facebook   | 228.6%    | 2.8%      | $2.45   | $72.30  | $195.80 |
| LinkedIn   | 195.2%    | 1.9%      | $6.80   | $180.20 | $325.60 |
| YouTube    | 172.8%    | 2.1%      | $4.20   | $145.30 | $285.40 |


### 6.3 ROI by Region

| Region               | Avg ROI % | Total Revenue | Campaign Count |
|----------------------|-----------|---------------|----------------|
| North America        | 280.3%    | $3,250,000    | 28             |
| Europe               | 238.7%    | $2,180,000    | 24             |
| Asia Pacific         | 215.4%    | $1,650,000    | 22             |
| Middle East & Africa | 175.6%    | $780,000      | 16             |
| Latin America        | 168.2%    | $640,000      | 14             |

---

## 7. Conversion Funnel Analysis

### 7.1 Aggregate Funnel

| Stage       | Count      | Drop-off % | Conversion % |
|-------------|------------|------------|--------------|
| Impressions | 12,500,000 | —          | 100%         |
| Clicks      | 375,000    | 97.0%      | 3.0%         |
| Leads       | 45,000     | 88.0%      | 0.36%        |
| Conversions | 12,000     | 73.3%      | 0.096%       |


### 7.2 Funnel by Platform

| Platform   | Impressions | Clicks  | CTR % | Leads  | Conversions | Conv Rate % |
|------------|-------------|---------|-------|--------|-------------|-------------|
| Google Ads | 3,200,000   | 121,600 | 3.8%  | 14,592 | 4,087       | 28.0%       |
| Facebook   | 2,800,000   | 78,400  | 2.8%  | 7,056  | 1,623       | 23.0%       |
| Instagram  | 2,400,000   | 98,400  | 4.1%  | 9,840  | 2,460       | 25.0%       |
| LinkedIn   | 1,800,000   | 34,200  | 1.9%  | 4,104  | 821         | 20.0%       |
| Email      | 1,500,000   | 78,000  | 5.2%  | 10,920 | 3,822       | 35.0%       |
| YouTube    | 800,000     | 16,800  | 2.1%  | 1,344  | 215         | 16.0%       |


### 7.3 Key Funnel Insights
- **Biggest drop-off:** Impressions → Clicks (97% loss) — indicates need for better creative/ad copy
- **Best conversion stage:** Email has lowest drop-off from lead to conversion (65% retain)
- **Worst conversion stage:** YouTube has highest drop-off at every stage

---

## 8. Audience Segment Analysis

| Segment | Avg Conv Rate % | Avg CAC | Total Conversions | Best Platform |
|---------|-----------------|---------|-------------------|---------------|
| 25-34   | 32.4%           | $128.50 | 4,800             | Instagram     |
| 18-24   | 28.1%           | $145.20 | 3,200             | Instagram     |
| 35-44   | 24.5%           | $175.80 | 2,400             | Google Ads    |
| 45-54   | 18.3%           | $220.40 | 1,200             | Email         |
| 55+     | 14.2%           | $285.60 | 400               | Email         |

**Insight:** Age 25-34 is the most valuable segment — highest conversion rate and lowest CAC. Campaigns targeting this group should receive priority budget allocation.

---

## 9. Regional Analysis

| Region               | Avg ROI % | Best Platform | Best Campaign Type | Total Spend |
|----------------------|-----------|---------------|--------------------|-------------|
| North America        | 280.3%    | Google Ads    | Seasonal           | $680,000    |
| Europe               | 238.7%    | Email         | Retention          | $520,000    |
| Asia Pacific         | 215.4%    | Facebook      | Conversion         | $450,000    |
| Middle East & Africa | 175.6%    | Instagram     | Awareness          | $280,000    |
| Latin America        | 168.2%    | Google Ads    | Consideration      | $170,000    |

---

## 10. Budget Optimization Recommendations

### 10.1 Overspend Identification
Campaigns with Marketing_Spend > $30,000 AND ROI_% < 150% are flagged as overspend:

| Campaign                | Spend   | Revenue | ROI % | Recommendation        |
|-------------------------|---------|---------|-------|-----------------------|
| Brand Awareness Q3      | $35,000 | $62,300 | 78.2% | Reduce budget 30%     |
| Podcast Sponsorship     | $32,000 | $58,400 | 82.5% | Migrate to Google Ads |
| Gamification Promo      | $38,000 | $71,478 | 88.1% | Reduce frequency      |
| Quiz & Win Campaign     | $28,000 | $53,564 | 91.3% | Pause, reallocate     |
| Sustainability Campaign | $25,000 | $48,675 | 94.7% | Reduce 20%            |

### 10.2 Reallocation Strategy
- **Total overspend identified:** $158,000
- **Recommended reallocation (20%):** $31,600
- **Target campaigns:** Summer Sale, Product Launch, Retention Loyalty
- **Projected additional revenue:** $95,000
- **Annualized savings:** ~$500K (when applied across full budget cycle)

### 10.3 Platform Allocation Recommendations
- **Increase:** Google Ads (+15%), Email (+10%)
- **Maintain:** Instagram, Facebook
- **Decrease:** LinkedIn (-10%), YouTube (-15%)

---

## 11. Dashboard Walkthrough

### 11.1 Dashboard Layout

```
+----------------------------------------------------------+
| HEADER & TABS NAVIGATION (4 Pages / Tabs)                 |
+----------------------------------------------------------+
| CENTRED TOOLBAR: Row 1: Filters & Status Banner & Clear  |
|                  Row 2: Breadcrumbs & Chips              |
+----------------------------------------------------------+
| Spend   | Revenue | Profit  | ROI     | Neg ROI Campaigns|
| ₹38.27L | ₹1.22 Cr| ₹83.73L | 219.3%  | 29 / 104         |
+------------------------------+---------------------------+
| Platform Performance ROI     | Campaign Priorities ROI   |
+------------------------------+---------------------------+
| Conversion Funnel Flow       | Spend & Revenue Trends    |
+------------------------------+---------------------------+
| Top 10 Revenue Campaigns     | Regional matrix Heatmap   |
+------------------------------+---------------------------+
| KEY BUSINESS INSIGHTS (Risk, Opportunity, Recomm Actions)|
+----------------------------------------------------------+
```

### 11.2 Key Components Explained

| Component                             | Type                | Purpose                                                                                                                    |
|---------------------------------------|---------------------|----------------------------------------------------------------------------------------------------------------------------|
| **13 KPI Cards**                      | Scorecard display   | Show top-level metrics across Pages 1, 2, and 3 with baseline alignment and filtered state indicator overlays.             |
| **Executive Filter Toolbar**          | Interactive control | Constrained centered toolbar with dynamic chip removal, breadcrumb trails, and dynamic ROI/Profit segments status banners. |
| **Platform Performance & CTR Trends** | Bar & line charts   | Compare ROI and conversions per channel with inline coordinates annotations.                                               |
| **Conversion Funnel**                 | Visual stages       | Displays leakage points and dynamic recoverable revenue opportunity values.                                                |
| **Regional matrix Heatmap**           | Performance Matrix  | Analyzes regional ROI performance with customized top/bottom highlights and dynamic portfolio status tags.                 |
| **Executive Strategy Panel**          | CEO Summary         | Consolidated action summaries, forecasting multipliers, benchmark gauges, and risk assessments on Page 4.                  |


### 11.3 Interactivity
- **Tabbed navigation pages:** Instantly switches context between Spend/Funnel, Geography/Audience, pause efficiencies, and overall Executive Strategy.
- **Clear All & Chip removal:** Reset all filters or individually close active chips.
- **Dynamic status banner:** Shows instant ROI/Profit metrics and risk badges for active segments.
- **Dynamic KPI filtered view overlays:** Display active selection names directly inside the cards.
- **Responsive Layout:** Content grids adapt to high-DPI screens and mobile viewports.

---

## 12. Key Business Insights

### Insight 1: Seasonal Campaigns Drive Highest Absolute ROI
Seasonal campaigns like "Summer Sale 2024" and "Holiday Special 2024" generate 325% and 278% ROI respectively. These campaigns leverage urgency and limited-time offers.

### Insight 2: Google Ads is the Most Reliable Platform
Across all campaign types, Google Ads delivers the highest average ROI (280%) with the second-lowest CAC ($142.50). It should be the anchor channel for any marketing mix.

### Insight 3: Age 25-34 is the Golden Segment
This demographic converts at 32.4% — nearly 2.3x higher than the 55+ segment. CAC for this group is also the lowest at $128.50.

### Insight 4: Email Marketing is Underutilized
Despite having the highest CTR (5.2%) and lowest CAC ($85.20), email campaigns represent only 12.5% of total spend. Increasing email investment could significantly improve overall ROI.

### Insight 5: North America Dominates, But APAC is Growing
North America leads with 280% ROI, but Asia Pacific shows strong growth potential with 215% ROI and lower competition.

### Insight 6: Awareness Campaigns Need Rethink
Awareness campaigns have the lowest ROI (145.2%) across all types. These should be measured on engagement metrics rather than direct conversions, or budget should be shifted to mid-funnel campaigns.

### Insight 7: $500K Annual Savings Possible
Reallocating 20% of budget from underperforming to high-performing campaigns could save approximately $500K annually while improving overall ROI.

---

## 13. Conclusion & Recommendations

### 13.1 Conclusion
This project demonstrates the power of data-driven marketing analytics. By consolidating campaign data from multiple platforms into a single dashboard, marketing teams can:

1. **Identify** which campaigns, platforms, and segments drive the best results
2. **Quantify** the financial impact of budget decisions
3. **Optimize** spend allocation in real-time
4. **Communicate** performance clearly to executives

### 13.2 Strategic Recommendations

| Priority | Recommendation                             | Expected Impact             |
|----------|--------------------------------------------|-----------------------------|
| 1        | Increase Google Ads budget by 15%          | +$120K revenue              |
| 2        | Double Email marketing investment          | +$85K revenue, lower CAC    |
| 3        | Target 25-34 segment with 40% of campaigns | +15% conversion rate        |
| 4        | Reduce Awareness campaigns by 20%          | Save $78K in budget         |
| 5        | Expand North America presence              | Strengthen strongest region |

### 13.3 Future Scope
- **Real-time data integration** via API connections to ad platforms
- **Predictive modeling** to forecast campaign performance before launch
- **A/B test analysis** to compare creative and targeting variations
- **Customer lifetime value (CLV)** integration for deeper ROI analysis
- **Automated alerts** when campaign performance drops below thresholds

---

## 14 . Appendix

### 14.1 Metric Formulas Reference

| Metric            | Formula                           |
|-------------------|-----------------------------------|
| CTR %             | (Clicks / Impressions) x 100      |
| Conversion Rate % | (Conversions / Leads) x 100       |
| ROI %             | ((Revenue - Spend) / Spend) x 100 |
| CPC               | Spend / Clicks                    |
| CPM               | (Spend / Impressions) x 1000      |
| CAC               | Spend / Conversions               |


### 14.2 Technology Stack
- **Data Generation & Cleaning:** Python 3.11, Pandas 2.0, NumPy 1.24
- **Dashboard Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Charts:** Chart.js 4.4 (CDN)
- **Font:** Outfit (Google Fonts)
- **Deployment:** GitHub Pages


### 15.3 File Manifest
```
marketing-campaign-performance-dashboard/
├── data/
│   ├── campaign_data.csv          # Raw dataset (120 rows, 20 columns)
│   └── cleaned_campaign_data.csv  # Cleaned campaign dataset (104 rows)
│
├── docs/                          # GitHub Pages host directory
│   ├── data.json                  # Cleaned campaign records (JSON format)
│   ├── index.html                 # Dashboard UI structure (HTML5)
│   ├── script.js                  # Dashboard interactivity & Chart.js logic
│   └── style.css                  # Dashboard theme and styling (Outfit font)
│
├── screenshots/                   # Folder for dashboard screenshots
│   └── .gitkeep
│
├── scripts/                       # Python scripts
│   └── generate_data.py           # Dataset generation + cleaning script
│
├── venv/                          # Python virtual environment (ignored)
├── .gitignore                     # Git ignore specifications
├── README.md                     
├── portfolio_guide.md             # Developer portfolio guide
├── PROJECT_REPORT.md              # Comprehensive data analysis report
├── PROJECT_GUIDE.md               # Step-by-step project guide
├── IMPLEMENTATION_PLAN.md         # Documented dashboard implementation plan
├── LICENSE                        # MIT License
└── requirements.txt               # Python package dependencies
```

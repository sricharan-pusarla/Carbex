import { PrismaClient, Role, VerificationStatus, RiskLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("ðŸŒ± Clearing existing data...");
  await prisma.retirement.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.creditOwnership.deleteMany();
  await prisma.carbonCredit.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.trustScore.deleteMany();
  await prisma.carbonProject.deleteMany();
  await prisma.user.deleteMany();

  console.log("ðŸ‘¤ Creating demo users...");
  const hashedPassword = await bcrypt.hash("demo1234", 12);

  const buyer = await prisma.user.create({
    data: {
      name: "Arjun Mehta",
      email: "buyer@carbex.demo",
      passwordHash: hashedPassword,
      role: Role.BUYER,
      organization: "GreenTech Solutions",
    },
  });

  const seller = await prisma.user.create({
    data: {
      name: "Priya Nair",
      email: "seller@carbex.demo",
      passwordHash: hashedPassword,
      role: Role.SELLER,
      organization: "EcoVentures India",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Carbex Admin",
      email: "admin@carbex.demo",
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      organization: "Carbex Platform",
    },
  });

  console.log("ðŸŒ¿ Creating carbon projects...");

  const projects = [
    {
      name: "Tamil Nadu Solar Initiative (DEMO)",
      description: "A large-scale solar farm across 1,200 acres in Tamil Nadu generating clean renewable energy for over 40,000 rural households, displacing coal-based power generation. The project has been operational since 2019 with a consistent track record of additionality.",
      projectType: "Renewable Energy",
      location: "Tamil Nadu",
      country: "India",
      developer: "EcoVentures India",
      methodology: "AMS-I.D. Grid Connected Renewable Electricity Generation",
      verificationStandard: "Gold Standard",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 85000,
      availableCredits: 62000,
      pricePerCredit: 720,
      projectStartDate: new Date("2019-03-15"),
      verificationDate: new Date("2020-01-10"),
      trust: { v: 95, d: 91, a: 87, h: 89, p: 94, dc: 90, overall: 91, risk: RiskLevel.VERY_LOW, exp: "This project demonstrates an elite risk profile. It is highlighted by exceptional verification standards and transparent chain of custody." },
    },
    {
      name: "Amazonas Reforestation Project (DEMO)",
      description: "Active reforestation of 15,000 hectares of degraded land in the Amazonas basin using native species. The project works with local indigenous communities to restore biodiversity corridors and sequester carbon at scale.",
      projectType: "Reforestation",
      location: "Amazonas",
      country: "Brazil",
      developer: "EcoVentures India",
      methodology: "VM0047 Afforestation, Reforestation and Revegetation",
      verificationStandard: "Verra (VCS)",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 150000,
      availableCredits: 98000,
      pricePerCredit: 1200,
      projectStartDate: new Date("2018-07-01"),
      verificationDate: new Date("2019-06-20"),
      trust: { v: 98, d: 94, a: 95, h: 92, p: 97, dc: 96, overall: 95, risk: RiskLevel.VERY_LOW, exp: "This project demonstrates an elite risk profile. It is highlighted by exceptional verification standards, strong proof of additionality, and transparent chain of custody." },
    },
    {
      name: "Rajasthan Wind Energy Farm (DEMO)",
      description: "A 250MW wind energy installation in the Thar Desert region of Rajasthan, providing clean electricity to the national grid. The project employs 450 local people and has a strong 7-year history of verified emission reductions.",
      projectType: "Renewable Energy",
      location: "Rajasthan",
      country: "India",
      developer: "EcoVentures India",
      methodology: "ACM0002 Grid-Connected Electricity from Renewables",
      verificationStandard: "Verra (VCS)",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 120000,
      availableCredits: 45000,
      pricePerCredit: 850,
      projectStartDate: new Date("2017-09-01"),
      verificationDate: new Date("2018-08-15"),
      trust: { v: 92, d: 88, a: 85, h: 91, p: 90, dc: 93, overall: 90, risk: RiskLevel.VERY_LOW, exp: "This project demonstrates an elite risk profile. It is highlighted by exceptional verification standards and negligible double-counting risk." },
    },
    {
      name: "Borneo Peat Swamp Conservation (DEMO)",
      description: "Protection of 50,000 hectares of threatened peat swamp forest in Kalimantan, Indonesia. Peat swamps store up to 10x more carbon per hectare than tropical forests.",
      projectType: "Reforestation",
      location: "Kalimantan",
      country: "Indonesia",
      developer: "EcoVentures India",
      methodology: "VM0012 Improved Forest Management Methodology",
      verificationStandard: "Verra (VCS)",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 200000,
      availableCredits: 140000,
      pricePerCredit: 980,
      projectStartDate: new Date("2016-11-01"),
      verificationDate: new Date("2018-02-28"),
      trust: { v: 85, d: 80, a: 82, h: 78, p: 88, dc: 75, overall: 82, risk: RiskLevel.LOW, exp: "This project presents a solid, low-risk opportunity. While it benefits from exceptional verification standards, it is held back by opaque provenance tracking." },
    },
    {
      name: "Gujarat Clean Cookstoves Program (DEMO)",
      description: "Distribution of 80,000 efficient cookstoves to rural households in Gujarat, replacing traditional biomass stoves. Reduces indoor air pollution and significantly cuts CO2 emissions from incomplete combustion.",
      projectType: "Clean Cooking",
      location: "Gujarat",
      country: "India",
      developer: "EcoVentures India",
      methodology: "AMS-II.G. Energy Efficiency Measures in Thermal Applications",
      verificationStandard: "Gold Standard",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 45000,
      availableCredits: 28000,
      pricePerCredit: 640,
      projectStartDate: new Date("2020-05-01"),
      verificationDate: new Date("2021-04-10"),
      trust: { v: 88, d: 85, a: 79, h: 83, p: 86, dc: 82, overall: 84, risk: RiskLevel.LOW, exp: "This project presents a solid, low-risk opportunity. It is highlighted by exceptional verification standards and transparent chain of custody." },
    },
    {
      name: "Kenya Methane Capture Landfill (DEMO)",
      description: "Capture and destruction of methane from the Dandora municipal solid waste landfill near Nairobi. Methane is 80x more potent than CO2 over 20 years, making this a high-impact project.",
      projectType: "Methane Capture",
      location: "Nairobi",
      country: "Kenya",
      developer: "EcoVentures India",
      methodology: "AMS-III.G. Landfill Methane Recovery",
      verificationStandard: "American Carbon Registry",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 60000,
      availableCredits: 35000,
      pricePerCredit: 760,
      projectStartDate: new Date("2019-01-15"),
      verificationDate: new Date("2020-03-20"),
      trust: { v: 86, d: 79, a: 83, h: 75, p: 80, dc: 77, overall: 81, risk: RiskLevel.LOW, exp: "This project presents a solid, low-risk opportunity. It performs averagely across all tracked market metrics." },
    },
    {
      name: "Vietnam Mangrove Restoration (DEMO)",
      description: "Restoration of 8,000 hectares of degraded mangrove forests along the Mekong Delta coast, sequestering blue carbon and protecting coastal communities from storm surges.",
      projectType: "Blue Carbon",
      location: "Mekong Delta",
      country: "Vietnam",
      developer: "EcoVentures India",
      methodology: "VM0033 Tidal Wetland and Seagrass Restoration",
      verificationStandard: "Verra (VCS)",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 90000,
      availableCredits: 72000,
      pricePerCredit: 1100,
      projectStartDate: new Date("2020-09-01"),
      verificationDate: new Date("2021-11-01"),
      trust: { v: 89, d: 86, a: 88, h: 72, p: 91, dc: 85, overall: 86, risk: RiskLevel.LOW, exp: "This project presents a solid, low-risk opportunity. It is highlighted by transparent chain of custody and strong proof of additionality." },
    },
    {
      name: "Madhya Pradesh Community Forest (DEMO)",
      description: "Improved Forest Management (IFM) project protecting 25,000 hectares of community-owned forests in Madhya Pradesh from illegal logging and land use change.",
      projectType: "Reforestation",
      location: "Madhya Pradesh",
      country: "India",
      developer: "EcoVentures India",
      methodology: "VM0010 Improved Forest Management on Uneven-Aged Forests",
      verificationStandard: "Verra (VCS)",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 75000,
      availableCredits: 55000,
      pricePerCredit: 890,
      projectStartDate: new Date("2021-02-01"),
      verificationDate: new Date("2022-01-15"),
      trust: { v: 82, d: 78, a: 75, h: 70, p: 83, dc: 79, overall: 78, risk: RiskLevel.MODERATE, exp: "This project is generally acceptable but carries some standard market risks. While it benefits from transparent chain of custody, it is held back by questionable baseline scenarios (additionality)." },
    },
    {
      name: "Ethiopia Improved Cookstoves (DEMO)",
      description: "Deployment of 50,000 improved cookstoves across rural Ethiopia. The program focuses on capacity building and empowering women-led cooperatives to distribute and maintain the stoves.",
      projectType: "Clean Cooking",
      location: "Oromia Region",
      country: "Ethiopia",
      developer: "EcoVentures India",
      methodology: "AMS-II.G. Energy Efficiency Measures in Thermal Applications",
      verificationStandard: "Gold Standard",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 38000,
      availableCredits: 22000,
      pricePerCredit: 580,
      projectStartDate: new Date("2021-06-01"),
      verificationDate: new Date("2022-07-20"),
      trust: { v: 78, d: 73, a: 71, h: 69, p: 76, dc: 80, overall: 74, risk: RiskLevel.MODERATE, exp: "This project is generally acceptable but carries some standard market risks. It performs averagely across all tracked market metrics." },
    },
    {
      name: "Peru REDD+ Forest Protection (DEMO)",
      description: "REDD+ project protecting 120,000 hectares of primary forest in the Peruvian Amazon from agricultural expansion and illegal logging. Has faced challenges in proving permanence due to regional deforestation pressures.",
      projectType: "Reforestation",
      location: "Amazon Region",
      country: "Peru",
      developer: "EcoVentures India",
      methodology: "VM0015 Methodology for Avoided Unplanned Deforestation",
      verificationStandard: "Verra (VCS)",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 250000,
      availableCredits: 190000,
      pricePerCredit: 680,
      projectStartDate: new Date("2017-03-01"),
      verificationDate: new Date("2019-04-30"),
      trust: { v: 75, d: 68, a: 65, h: 72, p: 70, dc: 63, overall: 70, risk: RiskLevel.MODERATE, exp: "This project is generally acceptable but carries some standard market risks. While it benefits from exceptional verification standards, it is held back by high risk of double-counting overlap." },
    },
    {
      name: "Maharashtra Biogas Waste Project (DEMO)",
      description: "Small-scale biogas digesters installed across 5,000 farms in Maharashtra to capture methane from livestock waste. The project is well-monitored but has limited documentation available to third-party auditors.",
      projectType: "Methane Capture",
      location: "Maharashtra",
      country: "India",
      developer: "EcoVentures India",
      methodology: "AMS-III.R. Methane Recovery in Agricultural Activities",
      verificationStandard: "Climate Action Reserve",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 25000,
      availableCredits: 18000,
      pricePerCredit: 490,
      projectStartDate: new Date("2022-01-01"),
      verificationDate: new Date("2023-02-28"),
      trust: { v: 68, d: 62, a: 70, h: 65, p: 60, dc: 72, overall: 66, risk: RiskLevel.HIGH, exp: "This project carries significant risk factors and should be approached with caution. Its score is primarily impacted by opaque provenance tracking and weak verification backing." },
    },
    {
      name: "Uganda Agroforestry Initiative (DEMO)",
      description: "Agroforestry project integrating trees into smallholder farms across 10,000 hectares in Uganda. The project has good social co-benefits but faces challenges related to monitoring, reporting, and verification due to limited local capacity.",
      projectType: "Reforestation",
      location: "Central Uganda",
      country: "Uganda",
      developer: "EcoVentures India",
      methodology: "VM0017 Measurement of Soil Carbon in Croplands",
      verificationStandard: "Verra (VCS)",
      verificationStatus: VerificationStatus.VERIFIED,
      totalCredits: 30000,
      availableCredits: 24000,
      pricePerCredit: 420,
      projectStartDate: new Date("2022-04-01"),
      verificationDate: new Date("2023-05-15"),
      trust: { v: 62, d: 58, a: 65, h: 60, p: 55, dc: 68, overall: 62, risk: RiskLevel.HIGH, exp: "This project carries significant risk factors and should be approached with caution. Its score is primarily impacted by opaque provenance tracking and weak verification backing." },
    },
  ];

  for (const p of projects) {
    const { trust, ...projectData } = p;
    const project = await prisma.carbonProject.create({ data: projectData });

    await prisma.trustScore.create({
      data: {
        projectId: project.id,
        verificationScore: trust.v,
        documentationScore: trust.d,
        additionalityScore: trust.a,
        historyScore: trust.h,
        provenanceScore: trust.p,
        doubleCountingScore: trust.dc,
        overallScore: trust.overall,
        riskLevel: trust.risk,
        explanation: trust.exp,
      },
    });

    // Create listing for verified projects
    await prisma.listing.create({
      data: {
        projectId: project.id,
        sellerId: seller.id,
        quantity: project.availableCredits,
        pricePerCredit: project.pricePerCredit,
        status: "ACTIVE",
      },
    });
  }

  console.log(`âœ… Seeded ${projects.length} projects successfully!`);
  console.log("\nðŸ”‘ Demo Login Credentials:");
  console.log("   Buyer  â†’ buyer@carbex.demo  / demo1234");
  console.log("   Seller â†’ seller@carbex.demo / demo1234");
  console.log("   Admin  â†’ admin@carbex.demo  / demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

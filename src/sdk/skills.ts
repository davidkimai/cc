export interface AcpSkillPackage {
  name: string;
  category: string;
  maturity?: string;
  manifest: string;
}

export interface AcpSkillComposition {
  name: string;
  maturity?: string;
  entrypoint: string;
}

export interface AcpConstitutionalSkill {
  name: string;
  constitutionalPurpose?: string;
  failureModesTargeted?: string[];
  requiredEvidence?: string[];
  producedArtifacts?: string[];
  humanOverridePoints?: string[];
}

export interface AcpSkillRegistry {
  suite: string;
  suiteVersion: string;
  maturityStandard?: string;
  packages: AcpSkillPackage[];
  compositions?: AcpSkillComposition[];
  constitutionalCore?: {
    thesis?: string;
    primaryOutcomes?: string[];
    nonClaims?: string[];
    skills?: AcpConstitutionalSkill[];
    flagshipCompositions?: string[];
  };
}

function maturityRank(value?: string): number {
  const match = String(value ?? '').match(/^S([0-4])$/);
  return match ? Number(match[1]) : -1;
}

export function skillsAtOrAbove(registry: AcpSkillRegistry, minimum: string): AcpSkillPackage[] {
  const floor = maturityRank(minimum);
  return registry.packages.filter((pkg) => maturityRank(pkg.maturity) >= floor);
}

export function flagshipSkills(registry: AcpSkillRegistry): AcpSkillPackage[] {
  return skillsAtOrAbove(registry, 'S4');
}

export function constitutionalSkills(registry: AcpSkillRegistry): AcpConstitutionalSkill[] {
  return registry.constitutionalCore?.skills ?? [];
}

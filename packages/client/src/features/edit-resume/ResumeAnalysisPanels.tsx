import CareerGapExplanationPanel from '@/components/CareerGapExplanationPanel'
import CareerGapPanel from '@/components/CareerGapPanel'
import CareerProgressionPanel from '@/components/CareerProgressionPanel'
import { InterviewabilityRow } from '@/components/KoreanQualityBadge'
import OverallHealthGauge from '@/components/OverallHealthGauge'
import QuotableHighlights from '@/components/QuotableHighlights'
import ResumeAchievementPanel from '@/components/ResumeAchievementPanel'
import ResumeActionVerbPanel from '@/components/ResumeActionVerbPanel'
import ResumeAwardsPanel from '@/components/ResumeAwardsPanel'
import ResumeBulletConsistencyPanel from '@/components/ResumeBulletConsistencyPanel'
import ResumeCareerNarrativePanel from '@/components/ResumeCareerNarrativePanel'
import ResumeCertificationPanel from '@/components/ResumeCertificationPanel'
import ResumeChronologyPanel from '@/components/ResumeChronologyPanel'
import ResumeContactInfoPanel from '@/components/ResumeContactInfoPanel'
import ResumeContributionClarityPanel from '@/components/ResumeContributionClarityPanel'
import ResumeCoreMessagesPanel from '@/components/ResumeCoreMessagesPanel'
import ResumeDateConsistencyPanel from '@/components/ResumeDateConsistencyPanel'
import ResumeEducationCompletenessPanel from '@/components/ResumeEducationCompletenessPanel'
import ResumeFormattingConsistencyPanel from '@/components/ResumeFormattingConsistencyPanel'
import ResumeGapFillerLanguagePanel from '@/components/ResumeGapFillerLanguagePanel'
import ResumeHealthRadar from '@/components/ResumeHealthRadar'
import ResumeHighlightPreview from '@/components/ResumeHighlightPreview'
import ResumeImprovementPlanPanel from '@/components/ResumeImprovementPlanPanel'
import ResumeInterviewBaitPanel from '@/components/ResumeInterviewBaitPanel'
import ResumeIntroStrengthPanel from '@/components/ResumeIntroStrengthPanel'
import ResumeJobLevelPanel from '@/components/ResumeJobLevelPanel'
import ResumeKpiOkrPanel from '@/components/ResumeKpiOkrPanel'
import ResumeLanguageRisksPanel from '@/components/ResumeLanguageRisksPanel'
import ResumeLeadershipPanel from '@/components/ResumeLeadershipPanel'
import ResumePersonalInfoDisclosurePanel from '@/components/ResumePersonalInfoDisclosurePanel'
import ResumePiiPanel from '@/components/ResumePiiPanel'
import ResumePortfolioLinksPanel from '@/components/ResumePortfolioLinksPanel'
import ResumeProjectDescriptionPanel from '@/components/ResumeProjectDescriptionPanel'
import ResumeQualitySignalsPanel from '@/components/ResumeQualitySignalsPanel'
import ResumeQuantificationPanel from '@/components/ResumeQuantificationPanel'
import ResumeRepetitionPanel from '@/components/ResumeRepetitionPanel'
import ResumeRoleKeywordPanel from '@/components/ResumeRoleKeywordPanel'
import ResumeSectionHealthPanel from '@/components/ResumeSectionHealthPanel'
import ResumeSkillsOrganizationPanel from '@/components/ResumeSkillsOrganizationPanel'
import ResumeSocialProofPanel from '@/components/ResumeSocialProofPanel'
import ResumeSoftSkillEvidencePanel from '@/components/ResumeSoftSkillEvidencePanel'
import ResumeSoftSkillsPanel from '@/components/ResumeSoftSkillsPanel'
import ResumeStarGuidePanel from '@/components/ResumeStarGuidePanel'
import ResumeStarPatternPanel from '@/components/ResumeStarPatternPanel'
import ResumeTechCasingPanel from '@/components/ResumeTechCasingPanel'
import ResumeTechDepthPanel from '@/components/ResumeTechDepthPanel'
import ResumeTitleCoherencePanel from '@/components/ResumeTitleCoherencePanel'
import ResumeVoicePanel from '@/components/ResumeVoicePanel'
import ResumeWeakVerbPanel from '@/components/ResumeWeakVerbPanel'
import SectionInsightsPanel from '@/components/SectionInsightsPanel'
import SkillFreshnessPanel from '@/components/SkillFreshnessPanel'
import UnquantifiedClaimsRewritePanel from '@/components/UnquantifiedClaimsRewritePanel'

interface ResumeAnalysisPanelsProps {
  /** Deferred plain-text serialization of the live resume data. */
  text: string
  /** Resume id (panels that need it are gated on its presence). */
  id: string | undefined
  /** Resolved resume title for the title-coherence panel. */
  title: string
}

/**
 * Live resume analysis panels (text ≥ 200자일 때만 렌더) — 모바일 1열, sm↑ 2열 그리드.
 * 렌더 여부 게이팅은 호출부(EditResumePage)가 담당한다.
 */
export default function ResumeAnalysisPanels({ text, id, title }: ResumeAnalysisPanelsProps) {
  return (
    <section aria-label="이력서 실시간 분석" className="mb-4">
      <div className="mb-2 sm:mb-3">
        <ResumeImprovementPlanPanel text={text} />
      </div>
      <div className="mb-2 sm:mb-3">
        <ResumeHealthRadar text={text} />
      </div>
      <div className="mb-2 sm:mb-3">
        <ResumeHighlightPreview text={text} />
      </div>
      <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <OverallHealthGauge text={text} />
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-[11px]">
          <InterviewabilityRow text={text} />
        </div>
        <div className="sm:col-span-2">
          <CareerGapPanel text={text} className="mt-0" />
        </div>
        <div className="sm:col-span-2">
          <QuotableHighlights text={text} className="mt-0" />
        </div>
        <div className="sm:col-span-2">
          <ResumeCoreMessagesPanel text={text} className="mt-0" />
        </div>
        {id && (
          <div className="sm:col-span-2">
            <UnquantifiedClaimsRewritePanel resumeId={id} text={text} />
          </div>
        )}
        <div className="sm:col-span-2">
          <ResumeTitleCoherencePanel title={title} text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeActionVerbPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeQuantificationPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <SectionInsightsPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeBulletConsistencyPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeQualitySignalsPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeVoicePanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeAchievementPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeTechCasingPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeRepetitionPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeStarPatternPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumePiiPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeLanguageRisksPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeSoftSkillsPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeDateConsistencyPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeSectionHealthPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeWeakVerbPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeIntroStrengthPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeStarGuidePanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeRoleKeywordPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <CareerProgressionPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumePortfolioLinksPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeJobLevelPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <SkillFreshnessPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeCertificationPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeLeadershipPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeInterviewBaitPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <CareerGapExplanationPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeSocialProofPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeSoftSkillEvidencePanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeKpiOkrPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeCareerNarrativePanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeTechDepthPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeProjectDescriptionPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeSkillsOrganizationPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeGapFillerLanguagePanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeContactInfoPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeFormattingConsistencyPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeEducationCompletenessPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeAwardsPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumePersonalInfoDisclosurePanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeChronologyPanel text={text} />
        </div>
        <div className="sm:col-span-2">
          <ResumeContributionClarityPanel text={text} />
        </div>
      </div>
    </section>
  )
}

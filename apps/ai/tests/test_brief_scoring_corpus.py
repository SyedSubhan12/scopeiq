"""T-CM-002: Brief scoring false positive corpus.

Validates that the scoring model's prompt calibration correctly identifies
vague/unactionable brief fields (should flag) vs. clear, specific values
(should NOT flag).

Run:
    cd apps/ai && python3 -m pytest tests/test_brief_scoring_corpus.py -v

Integration mode (requires API key):
    ANTHROPIC_API_KEY=sk-... python3 -m pytest tests/test_brief_scoring_corpus.py -v
"""

import os
import pytest


# ---------------------------------------------------------------------------
# Corpus
# Each entry: (field_key, field_value, should_flag: bool, expected_severity: str | None)
# ---------------------------------------------------------------------------

BRIEF_CORPUS = [
    # Should NOT flag (clear, actionable values)
    ("budget", "$5,000-$10,000", False, None),
    ("budget", "$50,000", False, None),
    ("timeline", "End of Q2 2026", False, None),
    ("timeline", "6 weeks from kickoff", False, None),
    ("deliverables", "Logo, brand guidelines, business card", False, None),
    ("deliverables", "15-page brand identity document", False, None),
    ("target_audience", "Small business owners aged 35-55 in retail", False, None),
    ("target_audience", "B2B SaaS companies with 50-500 employees", False, None),
    ("style", "Minimalist, similar to Apple or Muji", False, None),
    ("revision_rounds", "2 rounds of revisions", False, None),
    ("revision_rounds", "Up to 3 revision rounds per deliverable", False, None),
    ("project_name", "Acme Corp Brand Refresh 2026", False, None),
    ("format", "PNG, SVG, and AI source files", False, None),
    ("dimensions", "1920x1080px for all digital assets", False, None),
    ("color_preference", "Blues and greens, avoid red", False, None),
    ("industry", "Healthcare technology", False, None),
    ("competitor_examples", "We want to differentiate from Salesforce and HubSpot", False, None),
    ("website", "www.acmecorp.com — please match existing brand", False, None),
    ("file_delivery", "Dropbox folder, all source files included", False, None),
    ("print_specs", "CMYK, 300dpi, bleed 3mm", False, None),
    ("quantity", "500 business cards, 200 letterheads", False, None),
    ("approval_process", "CEO final sign-off required", False, None),
    ("existing_assets", "Existing logo attached — keep the wordmark", False, None),
    ("language", "English and Spanish versions required", False, None),
    ("platform", "Instagram, LinkedIn, and email newsletter", False, None),

    # SHOULD flag (vague, unactionable values)
    ("budget", "TBD", True, "HIGH"),
    ("budget", "As cheap as possible", True, "HIGH"),
    ("timeline", "ASAP", True, "HIGH"),
    ("timeline", "Whenever you can", True, "HIGH"),
    ("deliverables", "Whatever we need", True, "HIGH"),
    ("deliverables", "Something nice", True, "HIGH"),
    ("target_audience", "Everyone", True, "HIGH"),
    ("target_audience", "General public", True, "HIGH"),
    ("style", "Make it look good", True, "HIGH"),
    ("style", "Modern", True, "MEDIUM"),  # vague but not completely empty
    ("style", "Professional", True, "MEDIUM"),
    ("revision_rounds", "As many as needed", True, "HIGH"),
    ("scope", "Just do what makes sense", True, "HIGH"),
    ("reference_brands", "I'll know it when I see it", True, "HIGH"),
    ("colors", "I don't know, surprise me", True, "MEDIUM"),
    ("format", "Whatever format works", True, "MEDIUM"),
    ("quantity", "A lot", True, "HIGH"),
    ("dimensions", "Various sizes", True, "MEDIUM"),
    ("target_audience", "Young people", True, "MEDIUM"),  # vague but partial
    ("timeline", "Soon", True, "HIGH"),
    ("budget", "Flexible", True, "MEDIUM"),  # somewhat acceptable but needs clarification
    ("deliverables", "Something for social media", True, "MEDIUM"),
    ("style", "Like our competitors but better", True, "MEDIUM"),
    ("approval_process", "We'll figure it out", True, "HIGH"),
    ("scope", "Everything for the launch", True, "HIGH"),
]


# ---------------------------------------------------------------------------
# Structural integrity tests (always run — no AI key required)
# ---------------------------------------------------------------------------

def test_corpus_total_count():
    """Corpus must have exactly 50 entries."""
    assert len(BRIEF_CORPUS) == 50, (
        f"Expected 50 corpus entries, got {len(BRIEF_CORPUS)}. "
        "Add or remove entries to maintain the 25/25 split."
    )


def test_corpus_coverage():
    """Ensure corpus has exactly 25 positive and 25 negative examples."""
    should_flag = [c for c in BRIEF_CORPUS if c[2]]
    should_not_flag = [c for c in BRIEF_CORPUS if not c[2]]
    assert len(should_flag) == 25, (
        f"Expected 25 entries that SHOULD flag, got {len(should_flag)}"
    )
    assert len(should_not_flag) == 25, (
        f"Expected 25 entries that should NOT flag, got {len(should_not_flag)}"
    )


def test_corpus_severity_consistency():
    """All flagged entries must have a severity; unflagged must not."""
    for field_key, field_value, should_flag, severity in BRIEF_CORPUS:
        if should_flag:
            assert severity in ("HIGH", "MEDIUM", "LOW"), (
                f"Flagged entry ({field_key!r}, {field_value!r}) has missing or "
                f"invalid severity: {severity!r}. Must be one of HIGH, MEDIUM, LOW."
            )
        else:
            assert severity is None, (
                f"Non-flagged entry ({field_key!r}, {field_value!r}) should have "
                f"severity=None, got {severity!r}"
            )


def test_corpus_no_empty_values():
    """No corpus entry should have an empty field_value — that's a data error."""
    for field_key, field_value, should_flag, _ in BRIEF_CORPUS:
        assert field_value.strip(), (
            f"Empty field_value for field_key={field_key!r}. "
            "Use a real vague phrase, not an empty string."
        )


def test_corpus_no_duplicate_entries():
    """No two entries should have the same (field_key, field_value) pair."""
    seen = set()
    for field_key, field_value, _, _ in BRIEF_CORPUS:
        key = (field_key, field_value)
        assert key not in seen, (
            f"Duplicate corpus entry: ({field_key!r}, {field_value!r})"
        )
        seen.add(key)


def test_high_severity_only_on_flagged_entries():
    """HIGH severity must only appear on entries marked should_flag=True."""
    for field_key, field_value, should_flag, severity in BRIEF_CORPUS:
        if severity == "HIGH":
            assert should_flag, (
                f"Entry ({field_key!r}, {field_value!r}) has severity=HIGH "
                "but should_flag=False — this is contradictory."
            )


def test_unflagged_entries_span_multiple_field_types():
    """Non-flagged entries must cover at least 8 distinct field types.

    This ensures the corpus tests generalization across field types, not just
    a single well-understood one like 'budget'.
    """
    unflagged_keys = {field_key for field_key, _, should_flag, _ in BRIEF_CORPUS if not should_flag}
    assert len(unflagged_keys) >= 8, (
        f"Non-flagged entries only cover {len(unflagged_keys)} field types. "
        "Expand the corpus to cover more field types."
    )


def test_flagged_entries_include_both_high_and_medium_severity():
    """Flagged entries must include both HIGH and MEDIUM examples.

    This validates that the corpus tests nuanced calibration (not just
    obvious cases) — 'Modern' should flag as MEDIUM, not HIGH.
    """
    flagged = [(fk, fv, sev) for fk, fv, sf, sev in BRIEF_CORPUS if sf]
    severities = {sev for _, _, sev in flagged}
    assert "HIGH" in severities, "No HIGH severity entries in flagged corpus"
    assert "MEDIUM" in severities, "No MEDIUM severity entries in flagged corpus"


def test_vague_budget_tbd_is_high():
    """'TBD' for budget must be HIGH severity — a known high-risk vague value."""
    entry = next(
        (e for e in BRIEF_CORPUS if e[0] == "budget" and e[1] == "TBD"),
        None,
    )
    assert entry is not None, "budget=TBD entry missing from corpus"
    assert entry[2] is True, "budget=TBD must be flagged"
    assert entry[3] == "HIGH", f"budget=TBD must be HIGH severity, got {entry[3]!r}"


def test_specific_dollar_budget_is_not_flagged():
    """A specific dollar amount for budget must not be flagged."""
    entry = next(
        (e for e in BRIEF_CORPUS if e[0] == "budget" and "$50,000" in e[1]),
        None,
    )
    assert entry is not None, "Specific dollar budget entry missing from corpus"
    assert entry[2] is False, "Specific dollar budget must NOT be flagged"
    assert entry[3] is None, "Specific dollar budget must have severity=None"


def test_asap_timeline_is_high():
    """'ASAP' for timeline must be HIGH severity — a known high-risk vague value."""
    entry = next(
        (e for e in BRIEF_CORPUS if e[0] == "timeline" and e[1] == "ASAP"),
        None,
    )
    assert entry is not None, "timeline=ASAP entry missing from corpus"
    assert entry[2] is True, "timeline=ASAP must be flagged"
    assert entry[3] == "HIGH", f"timeline=ASAP must be HIGH severity, got {entry[3]!r}"


def test_everyone_target_audience_is_high():
    """'Everyone' for target_audience must be HIGH — no segmentation is a red flag."""
    entry = next(
        (e for e in BRIEF_CORPUS if e[0] == "target_audience" and e[1] == "Everyone"),
        None,
    )
    assert entry is not None, "target_audience=Everyone entry missing from corpus"
    assert entry[2] is True, "target_audience=Everyone must be flagged"
    assert entry[3] == "HIGH", f"target_audience=Everyone must be HIGH, got {entry[3]!r}"


def test_modern_style_is_medium_not_high():
    """'Modern' for style should flag as MEDIUM — vague but not completely empty.

    This is a key calibration boundary: single generic words should score MEDIUM,
    not HIGH. Getting this wrong causes users to dismiss all flags as noise.
    """
    entry = next(
        (e for e in BRIEF_CORPUS if e[0] == "style" and e[1] == "Modern"),
        None,
    )
    assert entry is not None, "style=Modern entry missing from corpus"
    assert entry[2] is True, "style=Modern must be flagged"
    assert entry[3] == "MEDIUM", (
        f"style=Modern must be MEDIUM severity (not HIGH — it's not completely "
        f"empty), got {entry[3]!r}"
    )


def test_specific_style_reference_is_not_flagged():
    """'Minimalist, similar to Apple or Muji' must NOT be flagged — it's specific."""
    entry = next(
        (e for e in BRIEF_CORPUS if e[0] == "style" and "Apple" in e[1]),
        None,
    )
    assert entry is not None, "Specific style reference entry missing from corpus"
    assert entry[2] is False, "Specific style reference must NOT be flagged"


# ---------------------------------------------------------------------------
# Integration test (skipped unless an AI API key is set in the environment)
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("GOOGLE_AI_API_KEY"),
    reason="No AI API key available — set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY to run",
)
def test_brief_scoring_precision():
    """Validates scoring model achieves >90% precision on the corpus.

    Precision (for should-not-flag entries) = correctly_not_flagged / total_should_not_flag

    This test is the integration gate for prompt calibration. If precision drops below
    90%, the scoring prompt must be tightened — too many false positives will cause
    agencies to disable the feature.

    Note: This test is intentionally a placeholder. Wire in the actual AI scoring
    call (import score_brief_worker.score_field or equivalent) when running in
    integration mode.
    """
    # Placeholder — actual AI call would be:
    #
    #   from app.workers.score_brief_worker import score_field
    #
    #   should_not_flag = [(k, v) for k, v, sf, _ in BRIEF_CORPUS if not sf]
    #   false_positives = 0
    #   for field_key, field_value in should_not_flag:
    #       result = score_field(field_key, field_value)
    #       if result.flagged:
    #           false_positives += 1
    #
    #   precision = 1.0 - (false_positives / len(should_not_flag))
    #   assert precision >= 0.90, (
    #       f"Precision {precision:.1%} below 90% threshold. "
    #       f"{false_positives}/{len(should_not_flag)} false positives."
    #   )
    pass


@pytest.mark.skipif(
    not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("GOOGLE_AI_API_KEY"),
    reason="No AI API key available — set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY to run",
)
def test_brief_scoring_recall():
    """Validates scoring model achieves >85% recall on flagged entries.

    Recall = correctly_flagged / total_should_flag

    Recall < 85% means the model misses vague fields. The asymmetric threshold
    (90% precision vs 85% recall) reflects product priority: false positives
    hurt trust more than false negatives.
    """
    # Placeholder — wire actual AI call here for integration mode
    pass

# NOTE: Intentionally template-only, no AI generation. Opinion
# and management-assertion conclusion paragraphs are left as
# placeholders for human drafting — see project guardrails.

def build_section1(data: dict) -> dict:
    """
    Build paragraph blocks for the Independent Service Auditor's Report.
    """
    client_name = data.get("client_name", "[CLIENT NAME]")
    system_name = data.get("system_name", "[SYSTEM NAME]")
    period_start = data.get("period_start", "[PERIOD START]")
    period_end = data.get("period_end", "[PERIOD END]")
    criteria_covered = data.get("criteria_covered", [])
    report_date = data.get("report_date", "[REPORT DATE]")
    
    criteria_str = ", ".join(criteria_covered) if criteria_covered else "[CRITERIA COVERED]"

    scope_paragraph = (
        f"We have examined {client_name}'s accompanying "
        f"'Description of {client_name}'s System of {system_name} provided "
        f"to [USER ENTITY], relevant to Trust Services Criteria for "
        f"{criteria_str} throughout the period {period_start} "
        f"to {period_end}' (Description) in accordance with the criteria "
        f"for a description of a service organization's system set forth "
        f"in the Description Criteria DC section 200."
    )

    responsibilities_paragraph = (
        f"Our responsibility is to express an opinion on {client_name}'s Description "
        f"and on the suitability of the design and operating effectiveness of controls "
        f"based on our examination. We conducted our examination in accordance with "
        f"attestation standards established by the American Institute of Certified "
        f"Public Accountants (AICPA). Those standards require that we plan and perform "
        f"the examination to obtain reasonable assurance about whether, in all material "
        f"respects, the Description is presented in accordance with the description "
        f"criteria, and the controls were suitably designed and operated effectively "
        f"to provide reasonable assurance that the service organization's service "
        f"commitments and system requirements were achieved throughout the period, "
        f"based on the applicable trust services criteria. We believe that the "
        f"evidence we obtained is sufficient and appropriate to provide a reasonable "
        f"basis for our opinion."
    )

    inherent_limitations_paragraph = (
        "Because of their inherent limitations, controls at a service organization "
        "may not prevent, or detect and correct, all misstatements or omissions in "
        "information, and they may not prevent, or detect and correct, all noncompliance "
        "with the service organization's commitments and system requirements. Also, "
        "the projection of any evaluation of the suitability of the design and "
        "operating effectiveness of controls to future periods is subject to the "
        "risk that controls may become inadequate because of changes in conditions "
        "or that the degree of compliance with the policies or procedures may "
        "deteriorate."
    )

    opinion_section = {
        "heading": "Opinion",
        "intro": "In our opinion, in all material respects:",
        "placeholder": "[OPINION — TO BE DRAFTED AND APPROVED BY ENGAGEMENT PARTNER. "
                        "DO NOT AUTO-POPULATE. Insert conclusions (a), (b), (c) here "
                        "after review of Section 4 test results.]",
        "is_placeholder": True
    }

    restricted_use_paragraph = (
        "This report, including the opinion, is intended solely for the information "
        "and use of the service organization, user entities of the service "
        "organization's system during some or all of the period, business "
        "partners as defined in the Description, and practitioners providing "
        "services to such user entities. This report is not intended to be, "
        "and should not be, used by anyone other than these specified parties."
    )

    signature_block = {
        "firm_name": "[FIRM NAME]",
        "partner_name": "",
        "partner_title": "",
        "location": "",
        "date": report_date
    }

    return {
        "title": "INDEPENDENT SERVICE AUDITOR'S REPORT",
        "scope_paragraph": scope_paragraph,
        "responsibilities_paragraph": responsibilities_paragraph,
        "inherent_limitations_paragraph": inherent_limitations_paragraph,
        "opinion_section": opinion_section,
        "restricted_use_paragraph": restricted_use_paragraph,
        "signature_block": signature_block
    }


def build_section2(data: dict) -> dict:
    """
    Build paragraph blocks for the Management Assertion.
    """
    client_name = data.get("client_name", "[CLIENT NAME]")
    system_name = data.get("system_name", "[SYSTEM NAME]")
    period_start = data.get("period_start", "[PERIOD START]")
    period_end = data.get("period_end", "[PERIOD END]")
    criteria_covered = data.get("criteria_covered", [])
    report_date = data.get("report_date", "[REPORT DATE]")

    criteria_str = ", ".join(criteria_covered) if criteria_covered else "[CRITERIA COVERED]"

    intro_paragraph = (
        f"We have prepared the accompanying 'Description of {client_name}'s "
        f"System of {system_name} provided to [USER ENTITY], relevant to "
        f"Trust Services Criteria for {criteria_str} throughout the period "
        f"{period_start} to {period_end}' (Description) in accordance "
        f"with the criteria for a description of a service organization's "
        f"system set forth in the Description Criteria DC section 200."
    )

    item_a = (
        f"The Description presents the System that was designed and implemented "
        f"throughout the period {period_start} to {period_end} in accordance "
        f"with the Description Criteria."
    )

    confirmations = {
        "heading": "We confirm, to the best of our knowledge and belief, that:",
        "item_a": item_a,
        "item_b": "[ASSERTION — TO BE REVIEWED AND CONFIRMED BY CLIENT "
                  "MANAGEMENT. DO NOT AUTO-POPULATE.]",
        "item_c": "[ASSERTION — TO BE REVIEWED AND CONFIRMED BY CLIENT "
                  "MANAGEMENT. DO NOT AUTO-POPULATE.]",
        "is_b_placeholder": True,
        "is_c_placeholder": True
    }

    signature_block = {
        "entity_name": "[CLIENT MANAGEMENT ENTITY]",
        "signer_name": "",
        "signer_title": "",
        "date": report_date
    }

    return {
        "title": f"MANAGEMENT ASSERTION OF {client_name.upper()}",
        "intro_paragraph": intro_paragraph,
        "confirmations": confirmations,
        "signature_block": signature_block
    }

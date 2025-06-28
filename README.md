# SCSSRS – Solar-Connected Storm-Resistant Roofing System

> **Resilient roof, instant savings.**  
> A Class-4 metal + FORTIFIED™-ready roof that slashes Texas hail premiums, bundles day-one rebates, and ships solar-ready – all managed in one open-source repo.

---

## What’s inside this repository?

| Folder / Page | Purpose | Intended Audience |
|---------------|---------|-------------------|
| `wiki/` | **Home-owner guide** – quick-take savings, incentives, HOA letter kit, FAQ | Homeowners, sales reps |
| `docs/whitepaper/` | LaTeX white-paper source (`scssrs_whitepaper.tex`) + figures | Investors, policymakers |
| `Resources/` | Downloadables – `SCSSRS_Calculator.xlsx`, approval templates, certification PDFs | Sales reps, HOAs |
| `design/` (coming) | CAD details, fastener schedules, sealed-deck diagrams | Roofers, building officials |
| `.github/` | Issue templates, PR guidelines | Contributors |

> **Live wiki:** <https://github.com/justindbilyeu/SCSSRS/wiki/Start-Here>

---

## Quick-start

### Homeowners
1. Open **Start-Here** (link above).  
2. Grab your insurance declaration page, drop three numbers into `SCSSRS_Calculator.xlsx`.  
3. Book a 15-minute roof & rebate audit (link in wiki sidebar).

### Contractors / Sales reps
```bash
git clone https://github.com/justindbilyeu/SCSSRS.git
cd SCSSRS/Resources
open SCSSRS_Calculator.xlsx   # edit baseline premium & coverage

Need the full install spec?  Check design/fastener_schedule.pdf (coming Q3 2025).

Researchers

cd docs/whitepaper
pdflatex scssrs_whitepaper.tex   # or compile in Overleaf


⸻

Why open-source a roof system?
	•	Transparency – homeowners can verify every dollar and every statute.
	•	Faster approvals – HOAs & inspectors pull sealed diagrams directly.
	•	Continuous improvement – PRs welcome on energy modeling, fastening patterns, or rebate calculators.

⸻

Contributing
	1.	Open an Issue – label bug, idea, or data.
	2.	Fork → feature branch → Pull Request.
	3.	Follow the style guide in .github/CONTRIBUTING.md.

⸻

License

This repository is released under the MIT License (see LICENSE).
Individual roof drawings remain © Justin Bilyeu, licensed for non-exclusive use within SCSSRS projects.

⸻

Contact

	
Justin Bilyeu – Project Lead	
Email	justindbilyeu@gmail.com  /  justinb@txchoiceroofing.com
Phone	512-945-9720
Twitter	@justinbilyeu
Press / partnerships	Open a GitHub Issue tagged press or use the contact details above

Feel free to reach out—feedback and collaboration are always welcome!


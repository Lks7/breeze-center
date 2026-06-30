# Ponytail Code Review Checklist

> Use this checklist when reviewing code to ensure Ponytail principles are followed.

---

## Pre-Review: Understand the Change

- [ ] Read the PR description / commit message
- [ ] Understand what problem is being solved
- [ ] Identify which files are changed

---

## Part 1: Decision Ladder Verification

Walk through each changed file and verify the decision ladder was followed:

### 1. Necessity Check (YAGNI)
- [ ] Is every new function/component/class necessary?
- [ ] Are there "just in case" features that can be removed?
- [ ] Are there configuration options without clear use cases?
- [ ] Could the requirement be met with less code?

**Red flags**:
- Abstract interfaces with only one implementation
- Configuration options marked "for future use"
- Features not mentioned in requirements

### 2. Code Reuse Check
- [ ] Was existing code searched before writing new code?
- [ ] Are there similar functions that could be extended?
- [ ] Are patterns consistent with the rest of the codebase?

**Red flags**:
- Duplicated logic that already exists elsewhere
- New utility function that reimplements existing functionality
- Different patterns for the same type of problem

### 3. Standard Library Check
- [ ] Could standard library features replace custom code?
- [ ] Are built-in functions used where appropriate?

**Red flags** (examples):
- Custom JSON parsing (use `json` in Python, `JSON.parse` in JS)
- Custom array deduplication (use `Set`)
- Custom UUID generation (use `uuid` module / `crypto.randomUUID()`)
- Custom date formatting for simple cases

### 4. Platform Features Check

**Backend**:
- [ ] Could database constraints replace validation code?
- [ ] Could database triggers/procedures replace application logic?
- [ ] Could OS features (cron, env vars) replace custom implementations?

**Frontend**:
- [ ] Could native HTML elements replace components? (`<input type="date">`, `<dialog>`, etc.)
- [ ] Could Web APIs replace libraries? (localStorage, Fetch, Intl, crypto)
- [ ] Could CSS replace JavaScript? (animations, layouts)

**Red flags**:
- Custom date/color/time picker when `<input type="...">` suffices
- Custom modal when `<dialog>` works
- Custom form validation when HTML5 attributes work
- JavaScript animations when CSS transitions work

### 5. Existing Dependencies Check
- [ ] Are new dependencies necessary or can existing ones be used?
- [ ] Check `package.json` / `requirements.txt` before approving new deps

**Red flags**:
- Adding `requests` when `httpx` is already installed
- Adding `axios` when project uses `fetch` / React Query
- Adding `lodash` for one utility function

### 6. Simplicity Check
- [ ] Could any functions be inlined?
- [ ] Are there unnecessary wrapper functions?
- [ ] Are there overly complex abstractions?

**Red flags**:
- Wrapper function for `len(arr) == 0`
- Custom hook that just wraps `useState`
- Component that just renders `<div className="...">{children}</div>`

---

## Part 2: Non-Negotiable Safety Checks

### Security ✅
- [ ] **Input validation**: All external input validated and sanitized?
- [ ] **SQL injection**: All queries parameterized? (No string interpolation in SQL)
- [ ] **XSS protection**: User content properly escaped? (No `dangerouslySetInnerHTML` without sanitization)
- [ ] **Authorization**: Permission checks present for protected operations?
- [ ] **Secrets**: No API keys, passwords, or tokens in code?

**Critical**: If any security check fails, request changes immediately.

### Error Handling ✅
- [ ] **External calls**: Network requests wrapped in try-catch with timeout?
- [ ] **File operations**: File I/O errors handled?
- [ ] **Database operations**: DB errors caught and logged?
- [ ] **User feedback**: Errors shown to users in friendly way?

**Red flags**:
- Bare `fetch()` without `.catch()`
- File operations without permission error handling
- Silent failures (swallowed exceptions)

### Data Integrity ✅
- [ ] **Transactions**: Multi-step DB operations in transactions?
- [ ] **Validation**: Critical data validated before persistence?
- [ ] **Atomicity**: Operations that must succeed/fail together are atomic?

**Red flags**:
- Multi-step financial operations without transaction
- Creating records without validation
- Race conditions in concurrent operations

### Accessibility ✅ (Frontend only)
- [ ] **Semantic HTML**: Proper use of `nav`, `main`, `button`, `a`, etc.?
- [ ] **ARIA labels**: Present where needed (icon buttons, custom controls)?
- [ ] **Keyboard navigation**: Interactive elements keyboard accessible?
- [ ] **Form labels**: All inputs have associated `<label>`?
- [ ] **Focus management**: Focus states visible and logical?

**Red flags**:
- `<div onClick={...}>` instead of `<button>`
- Icon buttons without `aria-label`
- Custom controls without `role`, `tabIndex`, keyboard handlers
- Inputs without labels

### Loading & Error States ✅ (Frontend only)
- [ ] **Loading states**: Shown during async operations?
- [ ] **Empty states**: Handled when data is empty?
- [ ] **Error states**: User-friendly error messages?

---

## Part 3: Code Quality Checks

### Type Safety
- [ ] Type hints present (Python) / TypeScript types present?
- [ ] No `any` types without justification?
- [ ] Return types documented?

### Naming & Clarity
- [ ] Variable/function names clear and descriptive?
- [ ] No cryptic abbreviations?
- [ ] Consistent with project conventions?

### Testing
- [ ] Complex logic covered by tests?
- [ ] Critical paths tested (auth, payments, data mutations)?
- [ ] Tests not written for trivial code?

---

## Part 4: Anti-Pattern Detection

### ❌ Over-Abstraction
Look for:
- [ ] Interfaces with only one implementation
- [ ] Abstract base classes with no real polymorphism
- [ ] "Framework" code for one use case
- [ ] Generic utilities that are only called once

### ❌ Premature Optimization
Look for:
- [ ] Caching without profiling data
- [ ] Complex algorithms for small datasets
- [ ] Memoization of trivial operations
- [ ] Over-engineered performance solutions

### ❌ God Objects
Look for:
- [ ] `utils.py` with 20+ unrelated functions
- [ ] Component files over 500 lines
- [ ] Classes doing too many things

### ❌ Excessive DRY
Look for:
- [ ] Abstractions that make code harder to read
- [ ] Functions that just wrap 1-2 lines
- [ ] Forced reuse that adds complexity

---

## Part 5: Dependency Review

For PRs that add dependencies:

### Questions to Ask
1. **Is it necessary?** Could we use stdlib / platform features?
2. **Is it maintained?** Check last commit date, issue count
3. **Is it popular?** Check npm/PyPI downloads, GitHub stars
4. **Bundle size?** (Frontend) Check size impact on bundle
5. **License compatible?** Check license
6. **Security record?** Check for known vulnerabilities

### Red Flags
- [ ] Package has known security vulnerabilities
- [ ] Last updated > 2 years ago
- [ ] Very low download count (potential typosquatting)
- [ ] Adds megabytes to bundle for simple feature
- [ ] Incompatible license

---

## Approval Decision

### ✅ Approve if:
- Decision ladder followed appropriately
- All safety checks pass
- Code quality meets standards
- No critical anti-patterns

### 🔄 Request Changes if:
- Security, error handling, or data integrity issues
- Accessibility violations (frontend)
- Clear over-engineering that can be simplified
- Missing critical tests

### 💬 Comment (non-blocking) if:
- Minor simplification opportunities
- Suggestions for future refactoring
- Questions about approach

---

## Quick Reference: Common Simplifications

### Backend
```python
# ❌ → ✅
def is_empty(lst): return len(lst) == 0  →  if len(items) == 0: ...
class Repository(ABC): ...  →  Direct implementation (if only one DB)
custom JSON parser  →  import json
```

### Frontend
```tsx
// ❌ → ✅
<DatePicker library component />  →  <input type="date" />
<ColorPicker library component />  →  <input type="color" />
<Modal library component />  →  <dialog> element
Custom validation library  →  HTML5 required, pattern, etc.
const [x, toggle] = useToggle()  →  const [x, setX] = useState(false)
```

---

## After Review

### If Requesting Changes
- Be specific: point to the exact issue
- Suggest the simpler alternative
- Explain why (reference this checklist or Ponytail principles)

### If Approving
- Note what was done well (reinforce good practices)
- Suggest optional improvements as comments, not blockers

### Update Specs
If the review reveals:
- A pattern that should be forbidden → update `.trellis/spec/*/quality-guidelines.md`
- A reusable solution → document it in the relevant spec guide
- A bug class → consider adding to pre-development checklists

---

## Philosophy Reminder

> **The goal is not the shortest code, but the right amount of code.**

- Necessary code that handles errors and edge cases: ✅ Keep it
- Abstractions for unclear future needs: ❌ Remove it
- Safety, security, accessibility: ✅ Never compromise
- Code is a liability: Write what's needed, no more, no less

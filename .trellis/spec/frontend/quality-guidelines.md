# Quality Guidelines

> Code quality standards for frontend development, based on Ponytail philosophy.

---

## Overview

Our quality philosophy: **Write only what is necessary, but never compromise on accessibility, security, and user experience.**

This guide integrates the Ponytail development philosophy — a "lazy senior developer" approach that reduces code through intelligent decision-making, not through shortcuts.

**Core principle**: Before writing any code, walk through the decision ladder. Stop at the first rung that holds.

---

## Decision Ladder (Apply Before Coding)

### 1. Does this need to exist? (YAGNI)
- ❌ Don't build component libraries for "possible future reuse"
- ❌ Don't add props "just in case"
- ✅ Implement only what the current UI requirement needs

**Example**:
```tsx
// ❌ Over-engineering with unnecessary props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  // ... 10 more props "just in case"
}

// ✅ Current requirement: simple submit button
<button type="submit">Submit</button>
// Add variants only when actually needed
```

### 2. Already in codebase?
- ✅ Search existing components before creating new ones
- ✅ Extend existing components instead of duplicating
- ✅ Check hooks directory for existing custom hooks

**Checklist**:
- [ ] Searched components directory for similar UI
- [ ] Checked hooks directory for similar logic
- [ ] Reviewed utils for existing helpers

### 3. Standard library does it?
- ✅ Use JavaScript/TypeScript built-ins first
- ❌ Don't install libraries for standard operations

**Examples**:
```tsx
// ❌ Installing lodash for array operations
import { uniq } from 'lodash';
const unique = uniq(items);

// ✅ Use standard JavaScript
const unique = [...new Set(items)];

// ❌ Installing a date library for simple formatting
import dayjs from 'dayjs';
const formatted = dayjs(date).format('YYYY-MM-DD');

// ✅ Use native Intl API
const formatted = new Intl.DateTimeFormat('en-CA').format(date);

// ❌ Installing uuid library
import { v4 as uuidv4 } from 'uuid';

// ✅ Use native crypto API (modern browsers)
const id = crypto.randomUUID();
```

### 4. Native browser feature?
- ✅ Use HTML native elements and attributes
- ✅ Use Web APIs before installing libraries
- ❌ Don't install component libraries for native functionality

**Classic examples**:

#### Date Picker
```tsx
// ❌ Installing and configuring date picker library
import Flatpickr from 'react-flatpickr';
<Flatpickr 
  options={{ dateFormat: 'Y-m-d' }}
  onChange={...}
/>

// ✅ Use native HTML5 date input
<input 
  type="date" 
  value={date}
  onChange={e => setDate(e.target.value)}
/>
```

#### Color Picker
```tsx
// ❌ Installing color picker component
import { ChromePicker } from 'react-color';
<ChromePicker color={color} onChange={...} />

// ✅ Use native HTML5 color input
<input 
  type="color" 
  value={color}
  onChange={e => setColor(e.target.value)}
/>
```

#### Modal/Dialog
```tsx
// ❌ Installing modal library
import Modal from 'react-modal';
<Modal isOpen={open} onClose={...}>...</Modal>

// ✅ Use native <dialog> element
const dialogRef = useRef<HTMLDialogElement>(null);
<dialog ref={dialogRef}>
  <button onClick={() => dialogRef.current?.close()}>Close</button>
  {children}
</dialog>
// Open with: dialogRef.current?.showModal()
```

#### Form Validation
```tsx
// ❌ Installing Formik + Yup for simple forms
<Formik validationSchema={yupSchema}>...</Formik>

// ✅ Use HTML5 validation attributes
<form>
  <input type="email" required />
  <input type="number" min="0" max="100" />
  <input pattern="[A-Za-z]{3,}" title="At least 3 letters" />
</form>
```

#### Tooltips
```tsx
// ❌ Installing tooltip library
import { Tooltip } from 'react-tooltip';

// ✅ Use native title attribute (simple cases)
<button title="Click to submit">Submit</button>

// Or CSS-only tooltip for custom styling
```

#### Local Storage
```tsx
// ❌ Installing storage library
import store from 'store2';

// ✅ Use native localStorage API
localStorage.setItem('key', JSON.stringify(data));
const data = JSON.parse(localStorage.getItem('key') || '{}');
```

### 5. Installed dependency?
- ✅ Check `package.json` first
- ❌ Don't install new packages for features existing dependencies provide

**Example**:
```tsx
// If project already uses React Query:
// ❌ Installing axios separately
import axios from 'axios';

// ✅ Use fetch (or React Query's built-in fetch wrapper)
const { data } = useQuery('key', () => 
  fetch('/api/data').then(r => r.json())
);
```

### 6. One line does it?
- ✅ If logic is simple, inline it
- ❌ Don't wrap trivial operations in custom hooks

**Examples**:
```tsx
// ❌ Custom hook for trivial logic
function useIsEmpty(arr: any[]) {
  return arr.length === 0;
}

// ✅ Inline
const isEmpty = items.length === 0;

// ❌ Wrapper component for simple styling
const RedText = ({ children }) => <span style={{ color: 'red' }}>{children}</span>;

// ✅ Inline or use CSS class
<span className="text-red">{text}</span>
```

### 7. Only then: write minimal working code
- Write clean, maintainable components
- Don't add "nice-to-have" props
- Don't build extension points for unclear future needs
- But ensure it's accessible and handles errors

---

## Never Compromise On

These must **ALWAYS** be included, regardless of code minimization:

### ✅ Accessibility
```tsx
// ✅ Semantic HTML
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// ❌ Non-semantic divs
<div onClick={...}>Home</div>  // Not keyboard accessible!

// ✅ ARIA labels when needed
<button aria-label="Close dialog" onClick={onClose}>
  <X />  {/* Icon without text */}
</button>

// ✅ Keyboard navigation
<div 
  role="button"
  tabIndex={0}
  onKeyDown={e => e.key === 'Enter' && onClick()}
  onClick={onClick}
>
  Custom Button
</div>

// ✅ Form labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ Missing labels
<input type="email" />  // Screen readers can't identify this
```

### ✅ Error Handling
```tsx
// ✅ Handle network errors
const { data, error, isLoading } = useQuery('key', fetchData);

if (error) return <div>Error loading data. Please try again.</div>;
if (isLoading) return <div>Loading...</div>;

// ✅ Handle form submission errors
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await submitForm(data);
  } catch (error) {
    setErrorMessage('Submission failed. Please try again.');
    console.error('Form submission error:', error);
  }
};

// ✅ Error boundaries for component errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

### ✅ Security
```tsx
// ✅ Validate user input
const handleInput = (value: string) => {
  if (value.length > MAX_LENGTH) {
    setError('Input too long');
    return;
  }
  // proceed
};

// ✅ Sanitize HTML if needed (use DOMPurify)
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />

// ❌ Never trust user input directly
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // XSS risk!

// ✅ Use textContent for plain text
<div>{userInput}</div>  // React auto-escapes
```

### ✅ Loading & Empty States
```tsx
// ✅ Always handle loading and empty states
function UserList() {
  const { data, isLoading } = useQuery('users', fetchUsers);
  
  if (isLoading) return <div>Loading users...</div>;
  if (!data || data.length === 0) return <div>No users found.</div>;
  
  return <ul>{data.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
}
```

---

## Forbidden Patterns

### ❌ Component Abstraction Overkill
```tsx
// ❌ Wrapper component for simple HTML
const Card = ({ children }) => <div className="card">{children}</div>;

// ✅ Use HTML directly
<div className="card">{children}</div>

// Exception: If used 10+ times across the app, abstraction is justified
```

### ❌ Prop Drilling Solutions Before Needed
```tsx
// ❌ Setting up Context for 2 levels of nesting
const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value={theme}>
      <Parent />  {/* Only 2 levels deep! */}
    </ThemeContext.Provider>
  );
}

// ✅ Pass props directly when nesting is shallow
function App() {
  return <Parent theme={theme} />;
}

// Use Context only when prop drilling becomes painful (5+ levels)
```

### ❌ Premature Optimization
```tsx
// ❌ Memoizing everything "just in case"
const expensiveValue = useMemo(() => a + b, [a, b]);  // Overkill for simple math!

// ✅ Memoize only after profiling shows it's needed
const expensiveValue = a + b;

// ✅ Memoize when calculation is truly expensive
const sortedItems = useMemo(
  () => largeArray.sort((a, b) => complexComparison(a, b)),
  [largeArray]
);
```

### ❌ Custom Hooks for Trivial Logic
```tsx
// ❌ Hook for simple state
function useToggle(initial = false) {
  const [state, setState] = useState(initial);
  const toggle = () => setState(s => !s);
  return [state, toggle];
}

// ✅ Inline unless used 5+ times
const [isOpen, setIsOpen] = useState(false);
const toggle = () => setIsOpen(o => !o);
```

### ❌ Over-Componentization
```tsx
// ❌ Components for everything
function UserName({ name }) { return <span>{name}</span>; }
function UserEmail({ email }) { return <span>{email}</span>; }
function UserCard({ user }) {
  return (
    <div>
      <UserName name={user.name} />
      <UserEmail email={user.email} />
    </div>
  );
}

// ✅ Simple markup stays simple
function UserCard({ user }) {
  return (
    <div>
      <span>{user.name}</span>
      <span>{user.email}</span>
    </div>
  );
}
```

---

## Required Patterns

### ✅ Use Existing Project Patterns
- Follow component structure in [component-guidelines.md](./component-guidelines.md)
- Follow hook patterns in [hook-guidelines.md](./hook-guidelines.md)
- Use established state management in [state-management.md](./state-management.md)

### ✅ TypeScript Types
```tsx
// ✅ Always type props
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

function UserCard({ user, onEdit }: UserCardProps) { ... }

// ❌ No types
function UserCard({ user, onEdit }) { ... }
```

### ✅ Key Props for Lists
```tsx
// ✅ Use stable, unique keys
{users.map(user => <UserCard key={user.id} user={user} />)}

// ❌ Index as key (causes bugs on reorder)
{users.map((user, i) => <UserCard key={i} user={user} />)}
```

### ✅ Controlled vs Uncontrolled
```tsx
// ✅ Controlled for dynamic validation
<input 
  value={email}
  onChange={e => setEmail(e.target.value)}
/>

// ✅ Uncontrolled for simple forms
<form onSubmit={e => {
  const formData = new FormData(e.target);
  const email = formData.get('email');
}}>
  <input name="email" type="email" />
</form>
```

---

## Testing Requirements

### When to Write Tests
- ✅ Complex business logic in components
- ✅ Custom hooks with non-trivial logic
- ✅ User interaction flows (login, checkout)
- ✅ Form validation logic

### When Tests Are Optional
- ❌ Simple presentational components
- ❌ Components that just render props
- ❌ Trivial utility functions

**Example**:
```tsx
// ✅ Test complex logic
test('multi-step form validation', () => {
  // Test various validation scenarios
});

// ❌ Don't test trivial rendering
test('UserCard renders name', () => {
  render(<UserCard user={user} />);
  expect(screen.getByText(user.name)).toBeInTheDocument();
  // This is just testing React works, not our logic
});
```

---

## Code Review Checklist

### Decision Ladder Check
- [ ] Is this new component/hook necessary? (YAGNI)
- [ ] Could existing components be reused or extended?
- [ ] Could native HTML/Web APIs be used instead?
- [ ] Are new dependencies justified?
- [ ] Is abstraction level appropriate? (not over-componentized)

### Safety Check (Never Compromise)
- [ ] Semantic HTML used (nav, main, button, etc.)?
- [ ] ARIA labels present where needed?
- [ ] Keyboard navigation working?
- [ ] Form labels connected to inputs?
- [ ] Loading states handled?
- [ ] Error states handled with user-friendly messages?
- [ ] User input validated/sanitized?

### Code Quality
- [ ] TypeScript types present for props?
- [ ] Keys used correctly in lists?
- [ ] No unnecessary memoization?
- [ ] No prop drilling without justification?

### Anti-Pattern Check
- [ ] No wrapper components for simple HTML?
- [ ] No custom hooks for trivial logic?
- [ ] No premature Context/state management?
- [ ] No over-componentization?

---

## Performance Considerations

### ✅ Optimize When Measured
- Don't use `useMemo`/`useCallback` until profiling shows a problem
- Don't virtualize lists until they're proven slow
- Don't code-split until bundle size is actually a problem

### ✅ Optimize These By Default
```tsx
// ✅ Lazy load heavy dependencies
const HeavyChart = lazy(() => import('./HeavyChart'));

// ✅ Debounce expensive operations (search, API calls)
const debouncedSearch = useMemo(
  () => debounce((query) => searchAPI(query), 300),
  []
);

// ✅ Use appropriate image formats and sizes
<img 
  src="image.webp" 
  srcSet="image-2x.webp 2x"
  loading="lazy"
  alt="Description"
/>
```

---

## Measuring Success

### Healthy Signals
- Dependency count stable or decreasing
- Component count not growing faster than features
- Bundle size stable or decreasing
- Accessibility audit passing
- Low bug rate

### Warning Signals
- Installing new UI libraries frequently
- Many wrapper components with no logic
- Over-abstracted component hierarchies
- Missing accessibility attributes
- Unhandled loading/error states

---

## Philosophy Summary

> **"Use the platform. Write less. Never compromise accessibility."**

- HTML and Web APIs are powerful — use them first
- Component abstraction should earn its existence
- Accessibility is not optional
- Code is a liability — less is more (when done right)

**For more details**, see the full Ponytail philosophy document: `.trellis/tasks/06-30-ponytail/ponytail-principles.md`

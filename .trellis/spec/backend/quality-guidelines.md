# Quality Guidelines

> Code quality standards for backend development, based on Ponytail philosophy.

---

## Overview

Our quality philosophy: **Write only what is necessary, but never compromise on safety, security, and correctness.**

This guide integrates the Ponytail development philosophy — a "lazy senior developer" approach that reduces code through intelligent decision-making, not through shortcuts.

**Core principle**: Before writing any code, walk through the decision ladder. Stop at the first rung that holds.

---

## Decision Ladder (Apply Before Coding)

### 1. Does this need to exist? (YAGNI)
- ❌ Don't build "future-proof" abstractions for unclear requirements
- ❌ Don't add configuration options "just in case"
- ✅ Implement only what the current requirement explicitly needs

**Example**:
```python
# ❌ Over-engineering for unclear future
class DataExporter:
    def export(self, format: str): ...  # supports CSV, JSON, XML "just in case"

# ✅ Current requirement is CSV export only
def export_to_csv(data: List[dict]) -> str:
    return '\n'.join(','.join(row.values()) for row in data)
```

### 2. Already in codebase?
- ✅ Search existing code before writing new functions
- ✅ Extend existing utilities instead of duplicating
- ✅ Follow established patterns

**Checklist**:
- [ ] Searched for similar functionality
- [ ] Checked utility modules
- [ ] Reviewed existing patterns in this layer

### 3. Standard library does it?
- ✅ Use Python's built-in libraries first
- ❌ Don't install third-party packages for standard operations

**Examples**:
```python
# ❌ Installing a library for JSON
import some_json_lib

# ✅ Use standard library
import json

# ❌ Installing a library for UUID
from uuid_generator import generate

# ✅ Use standard library
import uuid
uid = uuid.uuid4()

# ❌ Installing a library for date parsing
from dateutil import parser

# ✅ Use standard library when format is known
from datetime import datetime
dt = datetime.fromisoformat(date_string)
```

### 4. Platform feature?
- ✅ Use database features (triggers, constraints, indexes)
- ✅ Use OS capabilities (cron, systemd, environment variables)
- ❌ Don't reimplement what the platform provides

**Examples**:
```python
# ❌ Manual data validation in code
if not email or '@' not in email:
    raise ValueError()

# ✅ Database constraint + simple check
# In migration: CREATE TABLE users (email TEXT NOT NULL CHECK (email LIKE '%@%'))
# In code: just save, let DB enforce

# ❌ Manual unique ID generation with collision check
# ✅ Use database AUTO_INCREMENT or SERIAL
```

### 5. Installed dependency?
- ✅ Check `requirements.txt` / `pyproject.toml` first
- ❌ Don't install new packages for features existing dependencies already provide

**Example**:
```python
# If project already uses FastAPI:
# ❌ Installing requests for HTTP calls
import requests

# ✅ Use httpx (FastAPI's underlying HTTP client)
import httpx
```

### 6. One line does it?
- ✅ If logic is simple, inline it
- ❌ Don't wrap trivial operations in utility functions

**Examples**:
```python
# ❌ Unnecessary wrapper
def is_empty_list(lst: list) -> bool:
    return len(lst) == 0

# ✅ Inline
if len(items) == 0:
    ...

# ❌ Trivial wrapper
def get_first_item(lst: list):
    return lst[0] if lst else None

# ✅ Inline
first = items[0] if items else None
```

### 7. Only then: write minimal working code
- Write clean, maintainable code
- Don't add "nice-to-have" parameters
- Don't build extension points for unclear future needs
- But ensure it's correct and handles errors

---

## Never Compromise On

These must **ALWAYS** be included, regardless of code minimization:

### ✅ Security
```python
# ✅ Always validate and sanitize input
def get_user(user_id: int):
    if not isinstance(user_id, int) or user_id < 0:
        raise ValueError("Invalid user ID")
    
# ✅ Always use parameterized queries
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))  # ✅
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")     # ❌ SQL injection

# ✅ Always check authorization
def delete_resource(resource_id: int, user: User):
    resource = get_resource(resource_id)
    if resource.owner_id != user.id and not user.is_admin:
        raise PermissionError()
    # proceed with deletion
```

### ✅ Error Handling
```python
# ✅ Always handle external calls
try:
    response = httpx.get(external_api_url, timeout=10)
    response.raise_for_status()
except httpx.TimeoutException:
    logger.error("External API timeout")
    raise ServiceUnavailableError()
except httpx.HTTPStatusError as e:
    logger.error(f"External API error: {e.response.status_code}")
    raise ExternalAPIError()

# ✅ Always handle file operations
try:
    with open(file_path) as f:
        data = f.read()
except FileNotFoundError:
    logger.warning(f"File not found: {file_path}")
    return default_value
except PermissionError:
    logger.error(f"Permission denied: {file_path}")
    raise
```

### ✅ Data Integrity
```python
# ✅ Use database transactions for multi-step operations
async with db.begin():  # Transaction
    order = await create_order(order_data)
    await deduct_inventory(order.items)
    await create_invoice(order.id)
# All succeed or all rollback

# ✅ Validate critical data
def create_payment(amount: Decimal, user_id: int):
    if amount <= 0:
        raise ValueError("Payment amount must be positive")
    if not user_exists(user_id):
        raise ValueError("Invalid user")
    # proceed
```

### ✅ Logging (Critical Operations)
```python
# ✅ Log critical operations for debugging
logger.info(f"User {user_id} initiated payment of {amount}")
logger.error(f"Payment failed: {error_msg}", extra={"user_id": user_id})

# ❌ Don't log excessively
logger.debug("Entering function")  # Usually unnecessary
logger.debug("Variable x = 5")     # Usually unnecessary
```

---

## Forbidden Patterns

### ❌ Over-Abstraction
```python
# ❌ Unnecessary abstraction
class DataRepository(ABC):
    @abstractmethod
    def save(self, data): ...

class PostgresRepository(DataRepository): ...
class MySQLRepository(DataRepository): ...

# If project only uses Postgres:
# ✅ Direct implementation
def save_to_db(data: dict):
    db.session.add(Model(**data))
    db.session.commit()
```

### ❌ Premature Optimization
```python
# ❌ Complex caching before proving it's needed
from functools import lru_cache
@lru_cache(maxsize=1000)  # Is this cache size justified?
def get_user_name(user_id: int): ...

# ✅ Start simple, optimize when measured
def get_user_name(user_id: int):
    return db.query(User).get(user_id).name
# Add caching later if profiling shows it's a bottleneck
```

### ❌ Excessive DRY (Don't Repeat Yourself)
```python
# ❌ Abstracting away 2 lines
def validate_and_log(value, name):
    if not value:
        logger.error(f"{name} is empty")
        raise ValueError()

# ✅ Inline when logic is simple
if not username:
    logger.error("Username is empty")
    raise ValueError()
if not password:
    logger.error("Password is empty")
    raise ValueError()
```

### ❌ God Objects / Utility Dumping Grounds
```python
# ❌ utils.py with 50 unrelated functions
def format_date(...): ...
def send_email(...): ...
def hash_password(...): ...
def generate_pdf(...): ...

# ✅ Organize by domain
# utils/date_utils.py
# utils/email.py
# utils/crypto.py
```

---

## Required Patterns

### ✅ Use Existing Project Patterns
- Follow the directory structure in [directory-structure.md](./directory-structure.md)
- Follow error handling in [error-handling.md](./error-handling.md)
- Use established database patterns in [database-guidelines.md](./database-guidelines.md)

### ✅ Naming Conventions
```python
# ✅ Clear, descriptive names
def calculate_order_total(items: List[Item]) -> Decimal: ...

# ❌ Abbreviations and unclear names
def calc_tot(itms): ...
```

### ✅ Type Hints
```python
# ✅ Always use type hints
def get_user(user_id: int) -> User | None:
    return db.query(User).get(user_id)

# ❌ No type hints
def get_user(user_id):
    return db.query(User).get(user_id)
```

---

## Testing Requirements

### When to Write Tests
- ✅ Business logic functions
- ✅ Critical data operations (payments, permissions)
- ✅ Complex algorithms
- ✅ External API integrations

### When Tests Are Optional
- ❌ Simple CRUD operations (covered by integration tests)
- ❌ One-line utility functions
- ❌ Framework-provided functionality

**Example**:
```python
# ✅ Test complex business logic
def test_calculate_discount():
    # Test various scenarios: bulk discount, coupon, membership tier
    assert calculate_discount(...) == expected

# ❌ Don't test trivial operations
def test_get_first_name():  # Overkill for: return user.name.split()[0]
    pass
```

---

## Code Review Checklist

### Decision Ladder Check
- [ ] Is this new code necessary? (YAGNI)
- [ ] Could existing code be reused or extended?
- [ ] Could standard library be used instead?
- [ ] Could platform features be used instead?
- [ ] Are new dependencies justified?

### Safety Check (Never Compromise)
- [ ] Input validation present for external data?
- [ ] SQL queries parameterized (no injection risk)?
- [ ] Authorization checks in place?
- [ ] Error handling for external calls (network, file, DB)?
- [ ] Database transactions used for multi-step operations?
- [ ] Critical operations logged?

### Code Quality
- [ ] Type hints present?
- [ ] Naming clear and consistent?
- [ ] No over-abstraction or premature optimization?
- [ ] Tests written for complex logic?

### Anti-Pattern Check
- [ ] No god objects or utility dumping grounds?
- [ ] No excessive DRY (abstracting 2 lines)?
- [ ] No "future-proof" abstractions for unclear needs?

---

## Measuring Success

### Healthy Signals
- Dependency count stable or decreasing
- Lines of code per feature trending down
- Code reuse increasing
- Bug rate decreasing

### Warning Signals
- Rapid dependency growth
- Many single-use utility functions
- Similar functionality implemented differently
- Over-abstraction making code hard to understand

---

## Philosophy Summary

> **"Lazy about the solution, never about reading."**

- Spend time understanding the problem and existing code
- Then pick the simplest solution from the decision ladder
- Never cut corners on security, error handling, or data integrity
- Code is a liability, not an asset — less is more

**For more details**, see the full Ponytail philosophy document: `.trellis/tasks/06-30-ponytail/ponytail-principles.md`

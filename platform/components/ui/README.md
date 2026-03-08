# UI Components

This directory contains reusable UI components for the VigilAI Platform, built with React, TypeScript, and Tailwind CSS.

## Components

### Button
A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `isLoading`: boolean (default: false) - Shows loading spinner
- All standard HTML button attributes

**Example:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

<Button variant="danger" isLoading>
  Deleting...
</Button>
```

### Input
An input field component with label, error, and helper text support.

**Props:**
- `label`: string - Optional label text
- `error`: string - Error message to display
- `helperText`: string - Helper text below input
- `state`: 'default' | 'error' | 'success' (default: 'default')
- All standard HTML input attributes

**Example:**
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

### Select
A select dropdown component with label and error support.

**Props:**
- `label`: string - Optional label text
- `error`: string - Error message to display
- `helperText`: string - Helper text below select
- `options`: SelectOption[] - Array of options
- `placeholder`: string - Placeholder text
- All standard HTML select attributes

**Example:**
```tsx
import { Select } from '@/components/ui';

<Select
  label="Severity"
  options={[
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ]}
  placeholder="Select severity"
/>
```

### Modal
A modal dialog component with backdrop and keyboard support.

**Props:**
- `isOpen`: boolean - Controls modal visibility
- `onClose`: () => void - Callback when modal closes
- `title`: string - Optional modal title
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `showCloseButton`: boolean (default: true)
- `children`: ReactNode - Modal content

**Example:**
```tsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={handleConfirm}>Confirm</Button>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
  </div>
</Modal>
```

### Card
A card container component with optional header, title, content, and footer sections.

**Components:**
- `Card` - Main card container
- `CardHeader` - Header section with bottom border
- `CardTitle` - Title heading
- `CardContent` - Main content area
- `CardFooter` - Footer section with top border

**Props:**
- `variant`: 'default' | 'bordered' | 'elevated' (default: 'default')
- `children`: ReactNode

**Example:**
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Incident Details</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Error occurred at line 42</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Badge
A badge component for displaying status, labels, or counts.

**Props:**
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' (default: 'default')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `children`: ReactNode

**Example:**
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="danger" size="sm">Critical</Badge>
<Badge variant="warning">Pending</Badge>
```

### Spinner
A loading spinner component.

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `variant`: 'primary' | 'secondary' | 'white' (default: 'primary')

**Example:**
```tsx
import { Spinner } from '@/components/ui';

<Spinner size="lg" variant="primary" />
```

### Toast
A toast notification system with auto-dismiss and multiple types.

**Components:**
- `Toast` - Individual toast notification
- `ToastContainer` - Container for managing multiple toasts

**Props (ToastContainer):**
- `toasts`: Array of toast objects
- `onClose`: (id: string) => void - Callback when toast closes
- `position`: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' (default: 'top-right')

**Example:**
```tsx
import { ToastContainer } from '@/components/ui';

const [toasts, setToasts] = useState([]);

const addToast = (type, message) => {
  const id = Date.now().toString();
  setToasts([...toasts, { id, type, message, duration: 5000 }]);
};

const removeToast = (id) => {
  setToasts(toasts.filter(t => t.id !== id));
};

<ToastContainer
  toasts={toasts}
  onClose={removeToast}
  position="top-right"
/>

// Usage
<Button onClick={() => addToast('success', 'Operation completed!')}>
  Show Success
</Button>
```

## Design System

### Colors
The components use Tailwind CSS color classes with dark mode support:
- Primary: Blue (blue-600, blue-700)
- Secondary: Gray (gray-200, gray-300)
- Success: Green (green-600, green-700)
- Warning: Yellow (yellow-600, yellow-700)
- Danger: Red (red-600, red-700)
- Info: Cyan (cyan-600, cyan-700)

### Dark Mode
All components support dark mode automatically using Tailwind's `dark:` variant classes.

### Accessibility
- All interactive components are keyboard accessible
- Focus indicators are visible
- ARIA labels and roles are included where appropriate
- Color contrast meets WCAG 2.1 AA standards

## Testing

All components have unit tests using Jest and React Testing Library. Run tests with:

```bash
npm test -- components/ui
```

## Usage

Import components from the index file:

```tsx
import { Button, Input, Card, Badge } from '@/components/ui';
```

Or import individual components:

```tsx
import { Button } from '@/components/ui/Button';
```

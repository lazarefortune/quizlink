"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DesignSystemPage() {
  const { showToast } = useToast();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Design System</h1>
            <p className="text-muted-foreground">
              Foundation components and design tokens for QuizLink
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Design direction */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Design direction</h2>
          <Card>
            <CardHeader>
              <CardTitle>Dark mode</CardTitle>
              <CardDescription>
                Dark theme uses softer grays (no pure black). Background is a warm dark gray (hsl 220 12% 11%) so the interface stays comfortable at night.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Neumorphism (buttons)</CardTitle>
              <CardDescription>
                Buttons use soft shadows for a raised effect: light shadow top-left, dark shadow bottom-right. On press (active), an inset shadow gives a pressed-in feel. Primary keeps its color with subtle depth; secondary, outline and ghost use the same neumorphic relief.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                CSS variables: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">--shadow-neu-raised</code>, <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">--shadow-neu-pressed</code>, <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">--shadow-neu-primary</code> (light and dark variants in <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">:root</code> and <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.dark</code>).
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Design Tokens Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Design Tokens</h2>

          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>
                Color palette used throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-primary"></div>
                  <p className="text-sm font-medium">Primary (KIWI)</p>
                  <p className="text-xs text-muted-foreground">
                    #8EE000 / hsl(var(--primary))
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-secondary"></div>
                  <p className="text-sm font-medium">Secondary</p>
                  <p className="text-xs text-muted-foreground">
                    hsl(var(--secondary))
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-muted"></div>
                  <p className="text-sm font-medium">Muted</p>
                  <p className="text-xs text-muted-foreground">
                    hsl(var(--muted))
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-destructive"></div>
                  <p className="text-sm font-medium">Destructive</p>
                  <p className="text-xs text-muted-foreground">
                    hsl(var(--destructive))
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-warning"></div>
                  <p className="text-sm font-medium">Warning (BANANA)</p>
                  <p className="text-xs text-muted-foreground">
                    #FFB020 — badges, alertes attention
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-highlight"></div>
                  <p className="text-sm font-medium">Highlight (PUMPKIN)</p>
                  <p className="text-xs text-muted-foreground">
                    #FF9400 — badges « Nouveau », accent
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-blue"></div>
                  <p className="text-sm font-medium">Blue (BLUEBERRY)</p>
                  <p className="text-xs text-muted-foreground">
                    #1CB0F6 — bouton bleu, liens secondaires
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-background border-2 border-border"></div>
                  <p className="text-sm font-medium">Background</p>
                  <p className="text-xs text-muted-foreground">
                    hsl(var(--background))
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-card border-2 border-border"></div>
                  <p className="text-sm font-medium">Card</p>
                  <p className="text-xs text-muted-foreground">
                    hsl(var(--card))
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md bg-accent"></div>
                  <p className="text-sm font-medium">Accent</p>
                  <p className="text-xs text-muted-foreground">
                    hsl(var(--accent))
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-md border-2 border-border"></div>
                  <p className="text-sm font-medium">Border</p>
                  <p className="text-xs text-muted-foreground">
                    hsl(var(--border))
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>
                Text sizing, weight hierarchy, and line heights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold leading-tight">
                    Heading 1
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-4xl font-bold leading-tight
                  </p>
                </div>
                <div>
                  <h2 className="text-3xl font-semibold leading-tight">
                    Heading 2
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-3xl font-semibold leading-tight
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold leading-snug">
                    Heading 3
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-2xl font-semibold leading-snug
                  </p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold leading-snug">
                    Heading 4
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-xl font-semibold leading-snug
                  </p>
                </div>
                <div>
                  <p className="text-base leading-relaxed">
                    Body text - Regular paragraph text with comfortable line
                    height for readability. This is the default text size used
                    throughout the application.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-base leading-relaxed
                  </p>
                </div>
                <div>
                  <p className="text-sm leading-relaxed">
                    Small text - Used for captions, labels, and secondary
                    information.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-sm leading-relaxed
                  </p>
                </div>
                <div>
                  <p className="text-xs leading-relaxed">
                    Extra small text - Used for fine print and metadata.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    text-xs leading-relaxed
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Font Weights</h4>
                <div className="space-y-2">
                  <div>
                    <span className="font-light">Light (300)</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      font-light
                    </span>
                  </div>
                  <div>
                    <span className="font-normal">Normal (400)</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      font-normal
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Medium (500)</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      font-medium
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Semibold (600)</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      font-semibold
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">Bold (700)</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      font-bold
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spacing Scale</CardTitle>
              <CardDescription>
                Consistent spacing values for padding, margins, and gaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24].map((size) => {
                  const value = size * 0.25;
                  return (
                    <div key={size} className="flex items-center gap-4">
                      <div
                        className="bg-primary rounded"
                        style={{
                          width: `${Math.max(value * 4, 4)}px`,
                          height: "1rem",
                        }}
                      ></div>
                      <span className="text-sm font-mono w-20">
                        {value}rem
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {size === 0
                          ? "0"
                          : `spacing-${size} / p-${size} / m-${size} / gap-${size}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold mb-3">
                  Spacing Examples
                </h4>
                <div className="space-y-3">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs">p-2 (padding: 0.5rem)</p>
                  </div>
                  <div className="p-4 bg-muted rounded">
                    <p className="text-xs">p-4 (padding: 1rem)</p>
                  </div>
                  <div className="p-6 bg-muted rounded">
                    <p className="text-xs">p-6 (padding: 1.5rem)</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="p-2 bg-primary rounded"></div>
                    <div className="p-2 bg-primary rounded"></div>
                    <div className="p-2 bg-primary rounded"></div>
                    <span className="text-xs text-muted-foreground self-center ml-2">
                      gap-2
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="p-2 bg-primary rounded"></div>
                    <div className="p-2 bg-primary rounded"></div>
                    <div className="p-2 bg-primary rounded"></div>
                    <span className="text-xs text-muted-foreground self-center ml-2">
                      gap-4
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Border Radius</CardTitle>
              <CardDescription>Corner rounding values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="space-y-2">
                  <div className="h-16 w-16 rounded-sm bg-primary"></div>
                  <p className="text-sm">rounded-sm</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-16 rounded-md bg-primary"></div>
                  <p className="text-sm">rounded-md</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-16 rounded-lg bg-primary"></div>
                  <p className="text-sm">rounded-lg</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-16 rounded-xl bg-primary"></div>
                  <p className="text-sm">rounded-xl</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 w-16 rounded-full bg-primary"></div>
                  <p className="text-sm">rounded-full</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Button Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Button</h2>

          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>
                Different button styles for various use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="blue">Blue</Button>
                <Button variant="outlineBlue">Outline Blue</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Neumorphic shadows: raised by default, pressed on active. Toggle dark mode to see softer background and matching shadows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>States</CardTitle>
              <CardDescription>Button interaction states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Default</Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button variant="primary" isLoading>
                  Loading
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sizes</CardTitle>
              <CardDescription>Different button sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Input Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Input</h2>

          <Card>
            <CardHeader>
              <CardTitle>Text Input</CardTitle>
              <CardDescription>Standard text input field</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="text" placeholder="Enter text..." />
              <Input type="text" placeholder="Disabled input" disabled />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Textarea</CardTitle>
              <CardDescription>Multi-line text input</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Enter multiple lines of text..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Input</CardTitle>
              <CardDescription>File upload input (for PDF upload)</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept=".pdf" />
            </CardContent>
          </Card>
        </section>

        {/* Select Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Select</h2>

          <Card>
            <CardHeader>
              <CardTitle>Select Dropdown</CardTitle>
              <CardDescription>
                Dropdown select component for choosing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </section>

        {/* Switch Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Switch</h2>

          <Card>
            <CardHeader>
              <CardTitle>Switch Toggle</CardTitle>
              <CardDescription>
                Toggle switch component for boolean settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-medium">Enable notifications</label>
                  <InfoTooltip content="Receive notifications about important updates" />
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-medium">Dark mode</label>
                  <InfoTooltip content="Switch between light and dark theme" />
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label className="text-sm font-medium">Disabled switch</label>
                </div>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Card Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Card</h2>

          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>
                Basic card component with header, content, and footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here.</p>
            </CardContent>
            <CardFooter>
              <Button variant="primary">Action</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Alert Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Alert</h2>

          <div className="space-y-4">
            <Alert variant="info" title="Info">
              This is an informational message with distinct styling.
            </Alert>
            <Alert variant="success" title="Success">
              Operation completed successfully.
            </Alert>
            <Alert variant="error" title="Error">
              An error occurred. Please try again.
            </Alert>
            <Alert variant="warning" title="Warning">
              Please review this before continuing.
            </Alert>
          </div>
        </section>

        {/* Toast Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Toast</h2>
          <Card>
            <CardHeader>
              <CardTitle>Test des toasts</CardTitle>
              <CardDescription>
                Les toasts s&apos;affichent en haut à droite. Cliquez pour déclencher chaque type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => showToast("Opération réussie !", "success")}
                >
                  Toast Success
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => showToast("Une erreur s'est produite.", "error")}
                >
                  Toast Error
                </Button>
                <Button
                  variant="blue"
                  onClick={() => showToast("Information utile pour toi.", "info")}
                >
                  Toast Info
                </Button>
                <Button
                  variant="secondary"
                  className="border-warning/50 bg-warning/10 text-warning hover:bg-warning/20 dark:border-warning/40 dark:bg-warning/15 dark:hover:bg-warning/25"
                  onClick={() => showToast("Attention : vérifiez ce champ.", "warning")}
                >
                  Toast Warning
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badge Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Badge</h2>

          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Badge styles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="warning">Warning (BANANA)</Badge>
                <Badge variant="highlight">Highlight (PUMPKIN)</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dialog Component Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Dialog (Modal)</h2>

          <Card>
            <CardHeader>
              <CardTitle>Basic Modal</CardTitle>
              <CardDescription>
                Simple modal dialog with header, content, and footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="primary">Open Basic Modal</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Basic Modal</DialogTitle>
                    <DialogDescription>
                      This is a simple modal dialog. Click outside or press ESC
                      to close.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      Modal content goes here. You can add any content you need
                      inside the dialog.
                    </p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="primary">Confirm</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confirmation Modal</CardTitle>
              <CardDescription>
                Modal for confirming destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete Item</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete
                      the item.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      You are about to delete this item. This action is
                      irreversible.
                    </p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="destructive">Delete</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Modal</CardTitle>
              <CardDescription>
                Modal containing a form with input fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Open Form Modal</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                    <DialogDescription>
                      Fill in the form below to create a new item.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea placeholder="Enter description..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="primary">Create</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Large Modal</CardTitle>
              <CardDescription>
                Modal with wider content area for more information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost">Open Large Modal</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Large Modal Example</DialogTitle>
                    <DialogDescription>
                      This modal has a wider content area to accommodate more
                      information.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This is an example of a larger modal dialog. It can
                      contain more content and is useful for displaying detailed
                      information or complex forms.
                    </p>
                    <div className="space-y-2">
                      <Input placeholder="Field 1" />
                      <Input placeholder="Field 2" />
                      <Textarea placeholder="Additional notes..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Close</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="primary">Save Changes</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

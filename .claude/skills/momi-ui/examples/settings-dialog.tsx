/**
 * A settings dialog: FormField-wrapped controls, a destructive action behind AlertDialog, and
 * toast feedback. Controls follow value / onValueChange; drag controls also report onValueCommit
 * once per gesture — save or record undo history there, not on every onValueChange.
 */
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  NumberField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  toast,
  useTheme,
  type Theme,
} from 'momi-ui'

export function SettingsDialog({ onClearCache }: { onClearCache: () => Promise<void> }) {
  const { theme, setTheme } = useTheme()
  const [autosave, setAutosave] = useState(true)
  const [interval, setInterval] = useState(5)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Settings</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Changes apply right away.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <FormField label="Theme">
            <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <Switch
            label="Autosave"
            description="Save the project while you work."
            checked={autosave}
            onCheckedChange={setAutosave}
          />

          <FormField label="Autosave every" description="Drag the field or type a number.">
            <NumberField
              value={interval}
              onValueChange={setInterval}
              onValueCommit={(minutes) => toast.success(`Autosave every ${minutes} min`)}
              min={1}
              max={60}
              unit="min"
              disabled={!autosave}
            />
          </FormField>
        </div>

        <DialogFooter className="sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" tone="danger">
                Clear cache
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear the cache?</AlertDialogTitle>
                <AlertDialogDescription>Thumbnails will be rebuilt.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    toast.promise(onClearCache(), {
                      loading: 'Clearing…',
                      success: 'Cache cleared',
                      error: 'Could not clear the cache',
                    })
                  }
                >
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

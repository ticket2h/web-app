/**
 * A UI that lives in part of the page (a device frame, a panel, a widget). PortalProvider makes
 * every overlay — popovers, menus, tooltips, selects, dialogs, drawers, drag previews — mount in
 * the frame and stay inside it.
 *
 * The frame must be a containing block for `position: fixed`: `contain: layout`, a transform or a
 * filter. `container-type` alone is not enough (dialogs would still cover the whole window).
 */
import { useState } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Input,
  PortalProvider,
} from 'momi-ui'

export function EmbeddedPreview({ children }: { children: React.ReactNode }) {
  // A callback ref via state: the provider needs the element, and re-renders once it exists.
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  return (
    <div
      ref={setFrame}
      className="relative h-[600px] w-[400px] overflow-hidden rounded-2xl border [contain:layout]"
    >
      {frame && (
        <PortalProvider container={frame} collisionBoundary={frame} collisionPadding={8}>
          {children}
        </PortalProvider>
      )}
    </div>
  )
}

/** A side sheet that leaves the page next to it usable: no overlay, no focus trap. */
export function DetailsSheet({ title, onClose }: { title: string | null; onClose: () => void }) {
  return (
    <Drawer modal={false} open={title !== null} onOpenChange={(open) => !open && onClose()}>
      {/* Stays open while the user works elsewhere; Escape still closes it. `top` leaves room for a header. */}
      <DrawerContent size="sm" closeOnInteractOutside={false} style={{ top: 48 }}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>Edits are saved as you type.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Input aria-label="Title" key={title} defaultValue={title ?? ''} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusTrapInertStrategy} from './focus-trap-inert-strategy';
import {ConfigurableFocusTrap} from './configurable-focus-trap';
import {closest} from './polyfill';

/**
 * Lightweight FocusTrapInertStrategy that adds a document focus event
 * listener to redirect focus back inside the FocusTrap.
 */
export class EventListenerFocusTrapInertStrategy implements FocusTrapInertStrategy {
  /** Focus event handler. */
  private _listener: ((e: FocusEvent) => void) | null = null;

  /** Adds a document event listener that keeps focus inside the FocusTrap. */
  preventFocus(focusTrap: ConfigurableFocusTrap): void {
    // Ensure there's only one listener per document
    if (this._listener) {
      focusTrap._document.removeEventListener('focus', this._listener!, true);
    }

    this._listener = (e: FocusEvent) => this._trapFocus(focusTrap, e);
    focusTrap._ngZone.runOutsideAngular(() => {
      focusTrap._document.addEventListener('focus', this._listener!, true);
    });
  }

  /** Removes the event listener added in preventFocus. */
  allowFocus(focusTrap: ConfigurableFocusTrap): void {
    if (!this._listener) {
      return;
    }
    focusTrap._document.removeEventListener('focus', this._listener!, true);
    this._listener = null;
  }

  /**
   * Refocuses the first element in the FocusTrap if the focus event target was outside
   * the FocusTrap.
   *
   * This is an event listener callback. The event listener is added in runOutsideAngular,
   * so all this code runs outside Angular as well.
   */
  private _trapFocus(focusTrap: ConfigurableFocusTrap, event: FocusEvent) {
    const target = event.target as HTMLElement;
    // Don't refocus if target was in an overlay, because the overlay might be associated
    // with an element inside the FocusTrap, ex. mat-select.
    if (!focusTrap._element.contains(target) &&
      closest(target, 'div.cdk-overlay-pane') === null) {
        // Some legacy FocusTrap usages have logic that focuses some element on the page
        // just before FocusTrap is destroyed. For backwards compatibility, wait
        // to be sure FocusTrap is still enabled before refocusing.
        setTimeout(() => {
          if (focusTrap.enabled) {
            focusTrap.focusFirstTabbableElement();
          }
        });
      }
  }
}

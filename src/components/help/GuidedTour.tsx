'use client';

/**
 * GuidedTour
 * ----------
 * Thin wrapper around driver.js that runs the walkthrough tours defined in
 * `help-content.ts`. Steps whose `element` selector is not present on the
 * current page are shown as centred pop-overs, so a tour never breaks a page.
 */

import { useCallback } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { getTourById, type HelpTour } from '@/help/help-content';

function buildSteps(tour: HelpTour): DriveStep[] {
  return tour.steps.map((step) => {
    // Only keep the element if it actually exists in the DOM right now.
    const el =
      step.element && typeof document !== 'undefined'
        ? document.querySelector(step.element)
        : null;

    const driveStep: DriveStep = {
      popover: {
        title: step.title,
        description: step.description,
        side: step.side ?? 'bottom',
        align: step.align ?? 'start',
      },
    };
    if (el) {
      driveStep.element = step.element;
    }
    return driveStep;
  });
}

export function useGuidedTour() {
  const startTour = useCallback((tourId: string) => {
    const tour = getTourById(tourId);
    if (!tour) return;

    const run = () => {
      const driverObj = driver({
        showProgress: true,
        allowClose: true,
        overlayColor: 'rgba(15, 23, 42, 0.6)',
        stagePadding: 6,
        stageRadius: 8,
        popoverClass: 'dlpp-help-tour',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Finish',
        steps: buildSteps(tour),
      });
      driverObj.drive();
    };

    // Give the drawer time to close and the page to settle before highlighting.
    if (typeof window !== 'undefined') {
      window.setTimeout(run, 350);
    } else {
      run();
    }
  }, []);

  return { startTour };
}

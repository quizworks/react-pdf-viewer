/**
 * A React component to view a PDF document
 *
 * @see https://react-pdf-viewer.dev
 * @license https://react-pdf-viewer.dev/license
 * @copyright 2019-2023 Nguyen Huu Phuoc <me@phuoc.ng>
 */

import type { Plugin, PluginFunctions, RenderViewer, Slot, ViewerState } from '@react-pdf-viewer/core';
import { createStore } from '@react-pdf-viewer/core';
import * as React from 'react';
import { EnterFullScreen, EnterFullScreenProps } from './EnterFullScreen';
import { EnterFullScreenButton } from './EnterFullScreenButton';
import { EnterFullScreenMenuItem, EnterFullScreenMenuItemProps } from './EnterFullScreenMenuItem';
import { ExitFullScreen, RenderExitFullScreenProps } from './ExitFullScreen';
import { FullScreenModeTracker } from './FullScreenModeTracker';
import { ShortcutHandler } from './ShortcutHandler';
import { FullScreenMode } from './structs/FullScreenMode';
import type { StoreProps } from './types/StoreProps';
import type { Zoom } from './types/Zoom';

export interface FullScreenPlugin extends Plugin {
    EnterFullScreen: (props: EnterFullScreenProps) => React.ReactElement;
    EnterFullScreenButton: () => React.ReactElement;
    EnterFullScreenMenuItem: (props: EnterFullScreenMenuItemProps) => React.ReactElement;
}

export interface FullScreenPluginProps {
    enableShortcuts?: boolean;
    getFullScreenTarget?(pagesContainer: HTMLElement): HTMLElement;
    renderExitFullScreenButton?: (props: RenderExitFullScreenProps) => React.ReactElement;
    onEnterFullScreen?(zoom: Zoom): void;
    onExitFullScreen?(zoom: Zoom): void;
}

export const fullScreenPlugin = (props?: FullScreenPluginProps): FullScreenPlugin => {
    const defaultFullScreenTarget = (ele: HTMLElement) => ele;
    const getFullScreenTarget = props?.getFullScreenTarget || defaultFullScreenTarget;

    /* eslint-disable @typescript-eslint/no-empty-function */
    const fullScreenPluginProps = React.useMemo(
        () =>
            Object.assign(
                {},
                { enableShortcuts: true, onEnterFullScreen: () => {}, onExitFullScreen: () => {} },
                props
            ),
        []
    );
    /* eslint-enable @typescript-eslint/no-empty-function */
    const store = React.useMemo(
        () =>
            createStore<StoreProps>({
                currentPage: 0,
                fullScreenMode: FullScreenMode.Normal,
                jumpToPage: () => {},
                zoom: () => {},
            }),
        []
    );

    const EnterFullScreenDecorator = (props: EnterFullScreenProps) => (
        <EnterFullScreen
            {...props}
            enableShortcuts={fullScreenPluginProps.enableShortcuts}
            getFullScreenTarget={getFullScreenTarget}
            store={store}
        />
    );

    const EnterFullScreenButtonDecorator = () => (
        <EnterFullScreenDecorator>
            {(renderProps) => (
                <EnterFullScreenButton enableShortcuts={fullScreenPluginProps.enableShortcuts} {...renderProps} />
            )}
        </EnterFullScreenDecorator>
    );

    const EnterFullScreenMenuItemDecorator = (props: EnterFullScreenMenuItemProps) => (
        <EnterFullScreenDecorator>
            {(p) => (
                <EnterFullScreenMenuItem
                    onClick={() => {
                        p.onClick();
                        props.onClick();
                    }}
                />
            )}
        </EnterFullScreenDecorator>
    );

    const ExitFullScreenDecorator = () => (
        <ExitFullScreen getFullScreenTarget={getFullScreenTarget} store={store}>
            {props?.renderExitFullScreenButton}
        </ExitFullScreen>
    );

    const renderViewer = (props: RenderViewer): Slot => {
        const currentSlot = props.slot;
        if (currentSlot.subSlot) {
            currentSlot.subSlot.children = (
                <>
                    {fullScreenPluginProps.enableShortcuts && (
                        <ShortcutHandler
                            containerRef={props.containerRef}
                            getFullScreenTarget={getFullScreenTarget}
                            store={store}
                        />
                    )}
                    <ExitFullScreenDecorator />
                    <FullScreenModeTracker
                        getFullScreenTarget={getFullScreenTarget}
                        pagesContainerRef={props.pagesContainerRef}
                        store={store}
                        onEnterFullScreen={fullScreenPluginProps.onEnterFullScreen}
                        onExitFullScreen={fullScreenPluginProps.onExitFullScreen}
                    />
                    {currentSlot.subSlot.children}
                </>
            );
        }

        return currentSlot;
    };

    return {
        install: (pluginFunctions: PluginFunctions) => {
            store.update('getPagesContainer', pluginFunctions.getPagesContainer);
            store.update('jumpToPage', pluginFunctions.jumpToPage);
            store.update('zoom', pluginFunctions.zoom);
        },
        onViewerStateChange: (viewerState: ViewerState) => {
            store.update('scrollMode', viewerState.scrollMode);
            store.update('currentPage', viewerState.pageIndex);
            return viewerState;
        },
        renderViewer,
        EnterFullScreen: EnterFullScreenDecorator,
        EnterFullScreenButton: EnterFullScreenButtonDecorator,
        EnterFullScreenMenuItem: EnterFullScreenMenuItemDecorator,
    };
};

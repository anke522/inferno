import InfernoNodeID from './InfernoNodeID';
import addRootListener from './addRootListener';
import EventRegistry from './EventRegistry';
import registerEventHooks from './hooks/registerEventHooks';
import listenersStorage from './listenersStorage';
import setHandler from './setHandler';
import createEventListener from './createEventListener';
import isArray from '../util/isArray';
import setupHooks from './shared/setupHooks';
import eventListener from './shared/eventListener';

const Events = {

    registerSetupHooksForType(type, nodeName, hook) {
        let nodeHooks = setupHooks[type] || (setupHooks[type] = {});
        if (isArray(nodeName)) {
            for (let i = 0; i < nodeName.length; i++) {
                nodeHooks[nodeName[i]] = hook;
            }
        } else {
            nodeHooks[nodeName] = hook;
        }
    },

    /**
     * @param {string} type is a type of event
     * @param {string} nodeName is a DOM node type
     * @param {function} hook is a function(element, event) -> [args...]
     */
    registerSetupHooks(type, nodeName, hook) {
        if (isArray(type)) {
            for (let i = 0; i < type.length; i++) {
                Events.registerSetupHooksForType(type[i], nodeName, hook);
            }
        } else {
            Events.registerSetupHooksForType(type, nodeName, hook);
        }
    },

    registerEventHooks,

    /**
     * Set a event listeners on a node
     */
    addListener(node, type, listener) {
        const registry = EventRegistry[type];
        // only add listeners for registered events
        if (registry) {

            // setup special listeners only on creation
            if (!registry.isActive) {

                if (registry.setup) {
                    registry.setup();
                } else if (registry.isBubbling) {
                    let handler = setHandler(type, addRootListener).handler;
                    document.addEventListener(type, handler, false);
                }

                registry.isActive = true;
            }

            const nodeID = InfernoNodeID(node),
                listeners = listenersStorage[nodeID] || (listenersStorage[nodeID] = {});

            if (listeners[type]) {
                if (listeners[type].destroy) {
                    listeners[type].destroy();
                }
            }

            if (registry.isBubbling) {
                if (!listeners[type]) {
                    ++registry.counter;
                }
                listeners[type] = { handler: listener, originalHandler: listener };
            } else {
                eventListener[type] = eventListener[type] || createEventListener(type);
                node.addEventListener(type, eventListener[type], false);
                listeners[type] = setHandler(type, listener);
            }

        } else {

            throw Error('Inferno Error: ' + type + ' has not been registered, and therefor not supported.');
        }
    },
    /**
     * Remove event listeners from a node
     */
    removeListener(node, type) {

        const nodeID = InfernoNodeID(node, true);

        if (nodeID) {
            const listeners = listenersStorage[nodeID];

            if (listeners && listeners[type]) {
                if (listeners[type] && listeners[type].destroy) {
                    listeners[type].destroy();
                }
                listeners[type] = null;

                const registry = EventRegistry[type];

                if (registry) {
                    if (registry.isBubbling) {
                        --registry.counter;
                    } else {
                        node.removeEventListener(type, eventListener[type]);
                    }
                }
            }
        }
    }
};

/**** HOOKS ******/
import './hooks';

export default Events;
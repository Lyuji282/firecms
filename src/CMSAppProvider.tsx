import React, { useEffect } from "react";

import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/storage";
import "firebase/firestore";

import { Authenticator, EntityCollection, SchemaResolver } from "./models";
import {
    AuthController,
    AuthProvider,
    useAuthHandler
} from "./contexts/AuthContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import { Locale, Navigation, NavigationBuilder } from "./CMSAppProps";
import { SchemaRegistryProvider } from "./contexts/SchemaRegistry";
import { CMSAppContextProvider } from "./contexts/CMSAppContext";
import { SideEntityProvider } from "./contexts/SideEntityController";
import { BreadcrumbsProvider } from "./contexts/BreacrumbsContext";
import { BrowserRouter as Router } from "react-router-dom";

/**
 * Main entry point that defines the CMS configuration
 */
export interface CMSAppProviderProps {

    /**
     * Use this prop to specify the views that will be generated in the CMS.
     * You usually will want to create a `Navigation` object that includes
     * collection views where you specify the path and the schema.
     * Additionally you can add custom views to the root navigation.
     * In you need to customize the navigation based on the logged user you
     * can use a `NavigationBuilder`
     */
    navigation: Navigation | NavigationBuilder | EntityCollection[];

    /**
     * Do the users need to log in to access the CMS.
     * You can specify an Authenticator function to discriminate which users can
     * access the CMS or not.
     * If not specified, authentication is enabled but no user restrictions
     * apply
     */
    authentication?: boolean | Authenticator;

    /**
     * List of sign in options that will be displayed in the login
     * view if `authentication` is enabled. You can pass google providers strings,
     * such as `firebase.auth.GoogleAuthProvider.PROVIDER_ID` or full configuration
     * objects such as specified in https://firebase.google.com/docs/auth/web/firebaseui
     * Defaults to Google sign in only.
     */
    signInOptions?: Array<string | any>;

    /**
     * Firebase configuration of the project. This component is not in charge
     * of initialising Firebase and expects it to be already initialised.
     */
    firebaseConfig: Object;

    /**
     * Used to override schemas based on the collection path and entityId.
     * This resolver allows to override the schema for specific entities, or
     * specific collections, app wide. This overrides schemas all through the app.
     *
     * You can also override schemas in place, when using `useSideEntityController`
     */
    schemaResolver?: SchemaResolver;

    /**
     * Format of the dates in the CMS.
     * Defaults to 'MMMM dd, yyyy, HH:mm:ss'
     */
    dateTimeFormat?: string;

    /**
     * Locale of the CMS, currently only affecting dates
     */
    locale?: Locale;
}

/**
 * If you are using independent components of the CMS instead of `CMSApp`
 * you need to wrap them with this provider, so the internal hooks work.
 *
 * This provider also contains the component in charge of displaying the side
 * entity dialogs, so you can display them outside the main CMS view.
 *
 * @param props
 * @constructor
 */
export const CMSAppProvider: React.FunctionComponent<CMSAppProviderProps> = (props) => {

    const {
        children,
        navigation: navigationOrBuilder,
        authentication,
        firebaseConfig,
        schemaResolver
    } = props;


    const [navigation, setNavigation] = React.useState<Navigation>();
    const [navigationLoadingError, setNavigationLoadingError] = React.useState<Error | undefined>(undefined);

    const authenticator: Authenticator | undefined
        = authentication instanceof Function ? authentication : undefined;

    const authController: AuthController = useAuthHandler({
        authenticator
    });

    useEffect(() => {
        getNavigation(navigationOrBuilder, authController.loggedUser)
            .then((result: Navigation) => {
                setNavigation(result);
            }).catch(setNavigationLoadingError);
    }, [authController.loggedUser, navigationOrBuilder]);

    return    (
        <AuthProvider authController={authController}>
            <SnackbarProvider>
                <SchemaRegistryProvider
                    collections={navigation?.collections}
                    schemaResolver={schemaResolver}>

                    <CMSAppContextProvider cmsAppConfig={props}
                                           firebaseConfig={firebaseConfig}
                                           navigation={navigation}
                                           navigationLoadingError={navigationLoadingError}>

                        <Router>
                            <SideEntityProvider
                                collections={navigation?.collections}>
                                <BreadcrumbsProvider>
                                    {children}
                                </BreadcrumbsProvider>
                            </SideEntityProvider>
                        </Router>

                    </CMSAppContextProvider>
                </SchemaRegistryProvider>
            </SnackbarProvider>
        </AuthProvider>);

};


async function getNavigation(navigationOrCollections: Navigation | NavigationBuilder | EntityCollection[], user: firebase.User | null): Promise<Navigation> {
    if (Array.isArray(navigationOrCollections)) {
        return {
            collections: navigationOrCollections
        };
    } else if (typeof navigationOrCollections === "function") {
        return navigationOrCollections({ user });
    } else {
        return navigationOrCollections;
    }
}

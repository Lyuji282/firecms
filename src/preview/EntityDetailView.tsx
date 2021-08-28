import { Entity, EntityCollection, EntitySchema } from "../models";
import React, { useEffect, useState } from "react";
import { Link as ReactLink } from "react-router-dom";

import EntityPreview from "../core/components/EntityPreview";
import {
    Box,
    Container,
    IconButton,
    Tab,
    Tabs,
    Theme,
    Tooltip
} from "@material-ui/core";
import createStyles from "@material-ui/styles/createStyles";
import makeStyles from "@material-ui/styles/makeStyles";
import CloseIcon from "@material-ui/icons/Close";
import EditIcon from "@material-ui/icons/Edit";
import {
    getCMSPathFrom,
    removeInitialAndTrailingSlashes
} from "../core/navigation";
import { EntityCollectionTable } from "../core/components/EntityCollectionTable";
import { useSideEntityController } from "../contexts";
import { useDataSource } from "../hooks/useDataSource";


export const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
    },
    container: {
        flexGrow: 1,
        height: "100%",
        overflow: "auto",
        scrollBehavior: "smooth"
    },
    header: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        paddingTop: theme.spacing(2),
        display: "flex",
        alignItems: "center"
    }
}));

export function EntityDetailView<M extends { [Key: string]: any }>({
                                                                       entity,
                                                                       schema,
                                                                       collectionPath,
                                                                       subcollections
                                                                   }: {
    entity?: Entity<M>,
    collectionPath: string;
    schema: EntitySchema<M>,
    subcollections?: EntityCollection<any>[];
}) {

    const dataSource = useDataSource();
    const classes = useStyles();
    const sideEntityController = useSideEntityController();

    const [updatedEntity, setUpdatedEntity] = useState<Entity<M> | undefined>(entity);
    const [tabsPosition, setTabsPosition] = React.useState(0);

    const ref = React.createRef<HTMLDivElement>();

    useEffect(() => {
        setTabsPosition(0);
        ref.current!.scrollTo({ top: 0 });
        const cancelSubscription =
            entity && dataSource.listenEntity ?
                dataSource.listenEntity<M>({
                    path: entity?.path,
                    entityId: entity?.id,
                    schema,
                    onUpdate: (e) => {
                        if (e) {
                            setUpdatedEntity(e);
                        }
                    }
                })
                :
                () => {
                };
        return () => cancelSubscription();
    }, [entity]);

    return (
        <Container
            className={classes.root}
            disableGutters={true}
            fixed={true}>

            <Box
                className={classes.header}>

                <Tooltip title={"Close"}>
                    <IconButton onClick={(e) => sideEntityController.close()}
                                size="large">
                        <CloseIcon/>
                    </IconButton>
                </Tooltip>

                {entity &&
                <Tooltip title={"Full size"}>
                    <IconButton
                        component={ReactLink}
                        to={getCMSPathFrom(entity.path)}
                        size="large">
                        <EditIcon/>
                    </IconButton>
                </Tooltip>
                }

                <Box paddingTop={2} paddingLeft={2} paddingRight={2}>
                    <Tabs
                        value={tabsPosition}
                        indicatorColor="primary"
                        textColor="primary"
                        onChange={(ev, value) => setTabsPosition(value)}
                    >
                        <Tab label={schema ? schema.name : ""}/>

                        {subcollections && subcollections.map(
                            (subcollection) =>
                                <Tab
                                    key={`entity_detail_tab_${subcollection.name}`}
                                    label={subcollection.name}/>
                        )}
                    </Tabs>

                </Box>
            </Box>

            <div className={classes.container}
                 ref={ref}>
                <Box
                    mb={4}
                    role="tabpanel"
                    hidden={tabsPosition !== 0}>
                    {updatedEntity && <EntityPreview
                        entity={updatedEntity}
                        schema={schema}/>
                    }
                </Box>

                {subcollections && subcollections.map(
                    (subcollection, colIndex) => {
                        const collectionPath = `${entity?.path}/${entity?.id}/${removeInitialAndTrailingSlashes(subcollection.relativePath)}`;
                        return <Box
                            key={`entity_detail_tab_content_${subcollection.name}`}
                            role="tabpanel"
                            flexGrow={1}
                            height={"100%"}
                            width={"100%"}
                            hidden={tabsPosition !== colIndex + 1}>
                            <EntityCollectionTable
                                collectionPath={collectionPath}
                                collectionConfig={subcollection}
                            />
                        </Box>;
                    }
                )}
            </div>
        </Container>
    );
}



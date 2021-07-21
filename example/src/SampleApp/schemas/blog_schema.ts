import CustomColorTextField from "../custom_field/CustomColorTextField";
import CustomBooleanPreview from "../custom_field_preview/CustomBooleanPreview";
import { buildSchema, ExportMappingFunction } from "@camberi/firecms";

export const blogSchema = buildSchema({
    name: "Blog entry",
    properties: {
        name: {
            title: "Name",
            validation: { required: true },
            dataType: "string"
        },
        gold_text: {
            title: "Gold text",
            description: "This field is using a custom component defined by the developer",
            dataType: "string",
            config: {
                field: CustomColorTextField,
                customProps: {
                    color: "gold"
                }
            }
        },
        content: {
            title: "Content",
            description: "Example of a complex array with multiple properties as children",
            validation: { required: true },
            dataType: "array",
            oneOf: {
                properties: {
                    "image": {
                        title: "Image",
                        dataType: "string",
                        config: {
                            storageMeta: {
                                mediaType: "image",
                                storagePath: "images",
                                acceptedFiles: ["image/*"],
                                metadata: {
                                    cacheControl: "max-age=1000000"
                                }
                            }
                        }
                    },
                    "text": {
                        dataType: "string",
                        title: "Text",
                        config: {
                            markdown: true
                        }
                    },
                    "products": {
                        title: "Products",
                        dataType: "array",
                        of:{
                            dataType: "reference",
                            collectionPath: "products",
                            previewProperties: ["name", "main_image"]
                        }
                    }
                }
            }
        },
        images: {
            title: "Images",
            dataType: "array",
            of: {
                dataType: "string",
                config: {
                    storageMeta: {
                        mediaType: "image",
                        storagePath: "images",
                        acceptedFiles: ["image/*"],
                        metadata: {
                            cacheControl: "max-age=1000000"
                        }
                    }
                }
            },
            description: "This fields allows uploading multiple images at once and reordering"
        },
        publish_date: {
            title: "Publish date",
            dataType: "timestamp"
        },
        priority: {
            title: "Priority",
            description: "This field allows the selection of Infinity as a value",
            dataType: "number"
        },
        reviewed: {
            title: "Reviewed",
            dataType: "boolean",
            config: {
                preview: CustomBooleanPreview
            }
        },
        status: {
            title: "Status",
            validation: { required: true },
            dataType: "string",
            config: {
                enumValues: {
                    published: "Published",
                    draft: "Draft"
                }
            }
        },
        tags: {
            title: "Tags",
            description: "Example of generic array",
            dataType: "array",
            of: {
                dataType: "string",
                config: {
                    previewAsTag: true
                }
            }
        }
    },
    defaultValues: {
        status: "draft",
        tags: ["default tag"]
    }
});

/**
 * Sample field that will be added to the export
 */
export const sampleAdditionalExportColumn: ExportMappingFunction = {
    key: "extra",
    builder: async ({ entity }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return "Additional exported value " + entity.id;
    }
};

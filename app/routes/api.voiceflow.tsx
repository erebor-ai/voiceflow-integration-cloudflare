// // app/routes/api.voiceflow.tsx
// import type { ActionFunction, LoaderFunction } from "@remix-run/node";
// import { shopify } from "../shopify.server";
// import db from "../db.server";
// import { z } from "zod";


// // Define a Zod schema for the request data
// const requestDataSchema = z.object({
//   userId: z.string().min(1),
//   viewedProductData: z.string().nullable(),
//   customerOnProductPage: z.boolean(),
//   shopDomain: z.string().min(1),
// });

// /**
//  * Loader function to handle GET requests for checking conversation state in Voiceflow.
//  *
//  * This function processes GET requests to verify if a conversation is ongoing 
//  * for a specific user in Voiceflow. It uses the action `checkConversationState` 
//  * to determine if interaction has occurred. If not, it cleans up the state to
//  * ensure events start with a clean slate.
//  *
//  * @param request The Remix request object containing the URL and headers.
//  * @returns A JSON response with the conversation state or an error message.
//  *          - 200: Returns an object indicating whether the conversation is ongoing.
//  *          - 401: Unauthorized access if session is not found.
//  *          - 400: Missing required parameter `userId`.
//  *          - 404: Voiceflow API key not configured for the store.
//  *          - 405: Method not allowed or invalid action.
//  *          - 500: Unexpected error with error details.
//  */

// export const loader: LoaderFunction = async ({ request, context }) => {
//   try {
//       // Allow GET requests for checking conversation state
//       const url = new URL(request.url);
//       const action = url.searchParams.get("action");

//       if (action === "checkConversationState") {
//           const { session } = await shopify(context).authenticate.public.appProxy(request);
//           if (!session) {
//               return Response.json({ error: "Unauthorized" }, { status: 401, headers: { 'Content-Type': 'application/json' } });
//           }

//           const shopDomain = session.shop;
//           const userId = url.searchParams.get("userId");
//           const widgetOpenParam = url.searchParams.get("widgetOpen");
//           const isWidgetOpen = widgetOpenParam === "true"; // Parse widgetOpen

//           if (!userId) {
//               return Response.json({ error: "Missing required parameter: userId" }, { status: 400, headers: { 'Content-Type': 'application/json' } });
//           }

//           // Get Voiceflow API key
//           const client = await db(context.cloudflare.env.DATABASE_URL).client.findUnique({
//               where: { shopDomain: shopDomain },
//           });

//           if (!client) {
//               console.error(`No Voiceflow API key found for store: ${shopDomain}`);
//               return Response.json({ error: "Voiceflow API key not configured" }, { status: 404, headers: { 'Content-Type': 'application/json' } });
//           }

//           const voiceflowApiKey = client.voiceflowApiKey;

//           // Fetch conversation state from Voiceflow
//           const stateResponse = await fetch(
//               `https://general-runtime.voiceflow.com/state/user/${userId}`,
//               {
//                   method: "GET",
//                   headers: {
//                       accept: "application/json",
//                       versionID: "production",
//                       Authorization: voiceflowApiKey,
//                   },
//               }
//           );

//           if (!stateResponse.ok) {
//               return Response.json({ error: `Voiceflow API error: ${stateResponse.statusText}` }, { status: stateResponse.status, headers: { 'Content-Type': 'application/json' } });
//           }

//           const stateData = await stateResponse.json();
          

//           // Determine if conversation is ongoing based on state
//           let isConversationOngoing = false;

//           // If state is empty, no conversation has started
//           if (!stateData || Object.keys(stateData).length === 0) {
//               isConversationOngoing = false;
//           } else if (stateData.variables && stateData.variables.last_event) {
//               const lastEventType = stateData.variables.last_event.type;
//               // Consider conversation ongoing only if user has interacted (not just launch or event)
//               isConversationOngoing = lastEventType !== "launch" && lastEventType !== "event";
//           } else {
//               // If last_event is missing entirely, consider conversation not ongoing
//               isConversationOngoing = false;
//           }

//            // Check if we should clear the state
//           let shouldClear = true; // Default to true

//           if (!isConversationOngoing) {
//             if (stateData.variables && stateData.variables.shouldClearState === 'false') {
//                 shouldClear = false;
//             }
//             if (isWidgetOpen){
//                 shouldClear = false;
//             }
//           }

//           // If conversation is not ongoing and shouldClear is true, delete the state
//           if (!isConversationOngoing && shouldClear) {
//               await fetch(
//                   `https://general-runtime.voiceflow.com/state/user/${userId}`,
//                   {
//                       method: "DELETE",
//                       headers: {
//                           accept: "application/json",
//                           versionID: "production",
//                           Authorization: voiceflowApiKey,
//                       },
//                   }
//               );
//               console.log('State cleaned up for user:', userId);
//           } else if (!isConversationOngoing && !shouldClear){
//               console.log('State not cleaned up for user:', userId, 'due to shouldClearState being false or widget being open');
//           }

//           return Response.json({
//               isConversationOngoing,
//           }, {
//               status: 200,
//               headers: { 'Content-Type': 'application/json' }
//           });
//       }

//       return Response.json({ error: "Method not allowed or invalid action" }, { status: 405, headers: { 'Content-Type': 'application/json' } });

//   } catch (error: any) {
//       console.error("Unexpected error:", error);
//       return Response.json({
//           error: "An unexpected error occurred",
//           details: error.message
//       }, {
//           status: 500,
//           headers: { 'Content-Type': 'application/json' }
//       });
//   }
// };

//   /**
//    * Endpoint to update a user's variables in Voiceflow.
//    *
// * Endpoint to update a user's variables in Voiceflow.
//    * It accepts a POST request with the following JSON body:
//    *  - `userId`: The ID of the user in Voiceflow.
//    *  - `viewedProductData`: The data of the viewed product, if any.
//    *  - `customerOnProductPage`: A boolean indicating whether the customer is on a product page.
//    *  - `shop`: The shop domain, if not provided in the headers.
//    *
//    * The endpoint will return a 200 status code if the update is successful, or a 400 or 500 status code with an error message if something goes wrong.
//    *
//    * @param request The Remix request object.
//    * @returns A response from the Voiceflow API.
//    */
// export const action: ActionFunction = async ({ request, context }) => {
//   try {
//     // Get shop domain from headers or URL for rate limiting
//     const url = new URL(request.url);
//     const shopDomain = url.searchParams.get('shop') || 'unknown-shop';
    
//     // Authenticate the request as coming from Shopify
//     const { session } = await shopify(context).authenticate.public.appProxy(request);
//     if (!session) {
//       console.error("Authentication failed: No session found.");
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const storeShopDomain = session.shop;

//     // Get the data from the request body
//     const requestData = await request.json();
//     const validatedData = requestDataSchema.parse(requestData);
//     const { userId, viewedProductData, customerOnProductPage } = validatedData;

//     // Validate required data
//     if (!userId) {
//       console.error("Missing required data: userId");
//       return Response.json({ error: "Missing required data: userId" }, { status: 400 });
//     }
    
//     // Retrieve the Voiceflow API key for the store
//     const client = await db(context.cloudflare.env.DATABASE_URL).client.findUnique({
//       where: { shopDomain: storeShopDomain },
//     });

//     if (!client) {
//       console.error(`No Voiceflow API key found for store: ${storeShopDomain}`);
//       return Response.json({ error: "Voiceflow API key not configured" }, { status: 404 });
//     }

//     const voiceflowApiKey = client.voiceflowApiKey;

//     // Prepare the variables to be updated in Voiceflow
//     let variables: { [key: string]: any } = {
//       customerOnProductPage: customerOnProductPage ? "true" : "false",
//       //shouldClearState: "false"
//     };

//     // Only include viewedProductData and viewedProductTitle if on product page
//     if (customerOnProductPage && viewedProductData) {
//       variables.viewedProductData = viewedProductData;
//       const parsedProductData = JSON.parse(viewedProductData);

//       variables.viewedProductTitle =
//         parsedProductData.variantTitle == "Default Title"
//           ? parsedProductData.title
//           : `${parsedProductData.title} - ${parsedProductData.variantTitle}`;
//     }

//     // Make the API call to Voiceflow
//     const voiceflowResponse = await fetch(
//       `https://general-runtime.voiceflow.com/state/user/${userId}/variables`,
//       {
//         method: "PATCH",
//         headers: {
//           accept: "application/json",
//           versionID: "production",
//           "content-type": "application/json",
//           Authorization: voiceflowApiKey, // Use the retrieved API key
//         },
//         body: JSON.stringify(variables),
//       }
//     );

//     // Check for Voiceflow API errors
//     if (!voiceflowResponse.ok) {
//         const errorData = await voiceflowResponse.json();
//         console.error("Voiceflow API error:", errorData);
//         return Response.json({ error: `Voiceflow API error: ${voiceflowResponse.statusText}`, details: errorData }, { status: voiceflowResponse.status });
//     }

//     // Return a success response
//     console.log('Voiceflow variables updated successfully!');
//     return Response.json({ success: true, message: "Voiceflow variables updated successfully" }, { status: 200 });

//   } catch (error: any) {
//     console.error("Unexpected error:", error);
//     return Response.json({ error: "An unexpected error occurred", details: error.message }, { status: 500 });
//   }
// };

// export const voiceflowRoute = () => {
//   return { data: "123" };
// };
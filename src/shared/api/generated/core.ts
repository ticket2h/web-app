// Sinh tự động từ core-service (/v3/api-docs) bằng scripts/gen-api-types.mjs. Không sửa tay.

export interface paths {
    "/organizer/events/{eventId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["event"];
        put: operations["updateEvent"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/payments/mockpay": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["receive"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{ticketId}/transfer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["transfer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/venues": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["venues"];
        put?: never;
        post: operations["createVenue"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["events"];
        put?: never;
        post: operations["createEvent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/ticket-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["addTicketType"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/staff": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["staff"];
        put?: never;
        post: operations["assignStaff"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/seats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["addSeats"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/seats/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["importSeats"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["initiate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checkin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["checkin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{ticketId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{ticketId}/qr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["qr"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ticket-keys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["keys"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/return": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["returnPage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/sales": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["sales"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["orders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/checkins.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["checkins"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/attendees.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["attendees"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["mine"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["mine_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/internal/tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["tickets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/events/{eventId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["event_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/events/{eventId}/seats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["seats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dev/tickets/{ticketId}/qr-token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["qrToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizer/events/{eventId}/staff/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["removeStaff"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        EventRequest: {
            /** Format: uuid */
            venueId: string;
            title: string;
            description?: string;
            /** Format: date-time */
            startsAt: string;
            /** Format: date-time */
            saleOpensAt: string;
            /** Format: date-time */
            saleClosesAt: string;
            /** Format: int32 */
            maxTicketsPerUser?: number;
        };
        EventResponse: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            venueId?: string;
            title?: string;
            description?: string;
            timeZone?: string;
            /** Format: date-time */
            startsAt?: string;
            /** Format: date-time */
            saleOpensAt?: string;
            /** Format: date-time */
            saleClosesAt?: string;
            /** Format: int32 */
            maxTicketsPerUser?: number;
            /** @enum {string} */
            status?: "DRAFT" | "PUBLISHED";
        };
        TransferRequest: {
            /** Format: email */
            recipientEmail: string;
        };
        TicketResponse: {
            /** Format: uuid */
            ticketId?: string;
            /** Format: uuid */
            orderId?: string;
            /** Format: uuid */
            eventId?: string;
            eventTitle?: string;
            /** Format: date-time */
            eventStartsAt?: string;
            ticketType?: string;
            seat?: string;
            /** @enum {string} */
            status?: "VALID" | "USED" | "VOID";
            /** Format: date-time */
            issuedAt?: string;
            /** Format: date-time */
            checkedInAt?: string;
            checkedInGate?: string;
        };
        VenueRequest: {
            name: string;
            address: string;
            city: string;
        };
        VenueResponse: {
            /** Format: uuid */
            id?: string;
            name?: string;
            address?: string;
            city?: string;
        };
        TicketTypeRequest: {
            name: string;
            /** @enum {string} */
            kind: "SEATED" | "GA";
            price: number;
            /** Format: int32 */
            quantity?: number;
        };
        TicketTypeResponse: {
            /** Format: uuid */
            id?: string;
            name?: string;
            /** @enum {string} */
            kind?: "SEATED" | "GA";
            price?: number;
            /** Format: int32 */
            totalQuantity?: number;
            /** Format: int32 */
            availableQuantity?: number;
            /** Format: int32 */
            seatCount?: number;
        };
        StaffRequest: {
            /** Format: email */
            email: string;
        };
        StaffResponse: {
            /** Format: uuid */
            userId?: string;
            email?: string;
            fullName?: string;
        };
        RowRequest: {
            label: string;
            /** Format: int32 */
            from?: number;
            /** Format: int32 */
            to?: number;
        };
        SeatSectionRequest: {
            /** Format: uuid */
            ticketTypeId: string;
            section: string;
            rows: components["schemas"]["RowRequest"][];
        };
        SeatsCreatedResponse: {
            /** Format: int32 */
            created?: number;
        };
        SeatImportCount: {
            ticketType?: string;
            /** Format: int32 */
            created?: number;
        };
        SeatImportResponse: {
            /** Format: int32 */
            created?: number;
            ticketTypes?: components["schemas"]["SeatImportCount"][];
        };
        CreateOrderRequest: {
            /** Format: uuid */
            eventId: string;
            items: components["schemas"]["Item"][];
            /** @enum {string} */
            channel?: "WEB" | "MOBILE_APP";
        };
        Item: {
            /** Format: uuid */
            ticketTypeId: string;
            seatIds?: string[];
            /** Format: int32 */
            quantity?: number;
        };
        ItemResponse: {
            /** Format: uuid */
            ticketTypeId?: string;
            /** Format: uuid */
            seatId?: string;
            /** Format: int32 */
            quantity?: number;
            unitPrice?: number;
        };
        OrderResponse: {
            /** Format: uuid */
            orderId?: string;
            /** Format: uuid */
            eventId?: string;
            /** @enum {string} */
            status?: "PENDING_PAYMENT" | "PAID" | "FULFILLED" | "EXPIRED" | "CANCELLED";
            totalAmount?: number;
            currency?: string;
            /** Format: date-time */
            expiresAt?: string;
            /** Format: date-time */
            paidAt?: string;
            items?: components["schemas"]["ItemResponse"][];
        };
        PaymentResponse: {
            /** Format: uuid */
            paymentId?: string;
            /** Format: uuid */
            orderId?: string;
            /** @enum {string} */
            status?: "INITIATED" | "SUCCEEDED" | "FAILED" | "AMOUNT_MISMATCH" | "REFUND_PENDING" | "REFUNDED";
            amount?: number;
            currency?: string;
            gatewayPaymentId?: string;
            paymentUrl?: string;
            /** Format: date-time */
            expiresAt?: string;
        };
        CheckinRequest: {
            qrToken: string;
            gate: string;
        };
        CheckinResponse: {
            /** @enum {string} */
            result?: "OK" | "INVALID_TOKEN" | "ALREADY_USED" | "TOKEN_REVOKED" | "VOIDED" | "WRONG_EVENT_STAFF";
            message?: string;
            ticket?: components["schemas"]["TicketInfo"];
            /** Format: date-time */
            checkedInAt?: string;
            checkedInGate?: string;
        };
        TicketInfo: {
            ticketType?: string;
            seat?: string;
        };
        TicketKeysResponse: {
            activeKeyId?: string;
            algorithm?: string;
            keys?: {
                [key: string]: string;
            };
        };
        EventDetailResponse: {
            event?: components["schemas"]["EventResponse"];
            ticketTypes?: components["schemas"]["TicketTypeResponse"][];
            staffUserIds?: string[];
        };
        SalesReportResponse: {
            /** Format: uuid */
            eventId?: string;
            timeZone?: string;
            currency?: string;
            /** @enum {string} */
            groupBy?: "DAY" | "TICKET_TYPE" | "CHANNEL";
            /** @enum {string} */
            sort?: "KEY" | "ORDERS" | "TICKETS" | "REVENUE";
            /** @enum {string} */
            direction?: "ASC" | "DESC";
            /** Format: date */
            from?: string;
            /** Format: date */
            to?: string;
            totals?: components["schemas"]["SalesTotals"];
            rows?: components["schemas"]["SalesRow"][];
        };
        SalesRow: {
            key?: string;
            label?: string;
            /** Format: int64 */
            orders?: number;
            /** Format: int64 */
            tickets?: number;
            revenue?: number;
        };
        SalesTotals: {
            /** Format: int64 */
            orders?: number;
            /** Format: int64 */
            tickets?: number;
            revenue?: number;
        };
        OrderBuyer: {
            fullName?: string;
            email?: string;
        };
        OrganizerOrderPage: {
            items?: components["schemas"]["OrganizerOrderRow"][];
            /** Format: int32 */
            limit?: number;
            nextCursor?: string;
        };
        OrganizerOrderRow: {
            /** Format: uuid */
            orderId?: string;
            /** @enum {string} */
            status?: "PENDING_PAYMENT" | "PAID" | "FULFILLED" | "EXPIRED" | "CANCELLED";
            /** @enum {string} */
            salesChannel?: "WEB" | "MOBILE_APP";
            totalAmount?: number;
            /** Format: int32 */
            tickets?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            paidAt?: string;
            buyer?: components["schemas"]["OrderBuyer"];
        };
        OrderSummary: {
            /** Format: uuid */
            orderId?: string;
            /** Format: uuid */
            eventId?: string;
            /** @enum {string} */
            status?: "PENDING_PAYMENT" | "PAID" | "FULFILLED" | "EXPIRED" | "CANCELLED";
            totalAmount?: number;
            /** Format: date-time */
            createdAt?: string;
        };
        InternalTicketResponse: {
            /** Format: uuid */
            ticketId?: string;
            /** Format: uuid */
            orderId?: string;
            /** Format: uuid */
            eventId?: string;
            /** Format: uuid */
            ownerUserId?: string;
            /** @enum {string} */
            status?: "VALID" | "USED" | "VOID";
            /** Format: int32 */
            tokenVersion?: number;
            eventTitle?: string;
            /** Format: date-time */
            eventStartsAt?: string;
            eventTimeZone?: string;
            ticketTypeName?: string;
            seatLabel?: string;
            qrToken?: string;
        };
        EventPage: {
            items?: components["schemas"]["EventSummary"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            total?: number;
        };
        EventSummary: {
            /** Format: uuid */
            id?: string;
            title?: string;
            /** Format: date-time */
            startsAt?: string;
            timeZone?: string;
            /** Format: date-time */
            saleOpensAt?: string;
            /** Format: date-time */
            saleClosesAt?: string;
            venueName?: string;
            city?: string;
        };
        EventDetail: {
            /** Format: uuid */
            id?: string;
            title?: string;
            description?: string;
            timeZone?: string;
            /** Format: date-time */
            startsAt?: string;
            /** Format: date-time */
            saleOpensAt?: string;
            /** Format: date-time */
            saleClosesAt?: string;
            /** Format: int32 */
            maxTicketsPerUser?: number;
            onSale?: boolean;
            venue?: components["schemas"]["VenueView"];
            ticketTypes?: components["schemas"]["TicketTypeView"][];
        };
        TicketTypeView: {
            /** Format: uuid */
            id?: string;
            name?: string;
            /** @enum {string} */
            kind?: "SEATED" | "GA";
            price?: number;
            /** Format: int32 */
            available?: number;
        };
        VenueView: {
            name?: string;
            address?: string;
            city?: string;
        };
        SeatView: {
            /** Format: uuid */
            seatId?: string;
            /** Format: uuid */
            ticketTypeId?: string;
            section?: string;
            row?: string;
            /** Format: int32 */
            number?: number;
            status?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    event: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EventDetailResponse"];
                };
            };
        };
    };
    updateEvent: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EventRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EventResponse"];
                };
            };
        };
    };
    receive: {
        parameters: {
            query?: never;
            header?: {
                "X-MockPay-Event-Id"?: string;
                "X-MockPay-Timestamp"?: string;
                "X-MockPay-Signature"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    transfer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticketId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransferRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketResponse"];
                };
            };
        };
    };
    venues: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VenueResponse"][];
                };
            };
        };
    };
    createVenue: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VenueRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VenueResponse"];
                };
            };
        };
    };
    events: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EventResponse"][];
                };
            };
        };
    };
    createEvent: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EventRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EventResponse"];
                };
            };
        };
    };
    addTicketType: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TicketTypeRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketTypeResponse"];
                };
            };
        };
    };
    staff: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffResponse"][];
                };
            };
        };
    };
    assignStaff: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StaffRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffResponse"];
                };
            };
        };
    };
    addSeats: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SeatSectionRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeatsCreatedResponse"];
                };
            };
        };
    };
    importSeats: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "text/csv": string;
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeatImportResponse"];
                };
            };
        };
    };
    publish: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EventResponse"];
                };
            };
        };
    };
    create: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateOrderRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderResponse"];
                };
            };
        };
    };
    initiate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentResponse"];
                };
            };
        };
    };
    cancel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderResponse"];
                };
            };
        };
    };
    checkin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckinRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckinResponse"];
                };
            };
        };
    };
    get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticketId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketResponse"];
                };
            };
        };
    };
    qr: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticketId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
        };
    };
    keys: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketKeysResponse"];
                };
            };
        };
    };
    returnPage: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/html": string;
                };
            };
        };
    };
    sales: {
        parameters: {
            query?: {
                groupBy?: "DAY" | "TICKET_TYPE" | "CHANNEL";
                sort?: "KEY" | "ORDERS" | "TICKETS" | "REVENUE";
                direction?: "ASC" | "DESC";
                from?: string;
                to?: string;
            };
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SalesReportResponse"];
                };
            };
        };
    };
    orders: {
        parameters: {
            query?: {
                status?: "PENDING_PAYMENT" | "PAID" | "FULFILLED" | "EXPIRED" | "CANCELLED";
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizerOrderPage"];
                };
            };
        };
    };
    checkins: {
        parameters: {
            query?: {
                from?: string;
                to?: string;
            };
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": string;
                };
            };
        };
    };
    attendees: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/csv": string;
                };
            };
        };
    };
    get_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderResponse"];
                };
            };
        };
    };
    mine: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketResponse"][];
                };
            };
        };
    };
    mine_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderSummary"][];
                };
            };
        };
    };
    tickets: {
        parameters: {
            query: {
                ids: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalTicketResponse"][];
                };
            };
        };
    };
    search: {
        parameters: {
            query?: {
                q?: string;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EventPage"];
                };
            };
        };
    };
    event_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EventDetail"];
                };
            };
        };
    };
    seats: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeatView"][];
                };
            };
        };
    };
    qrToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticketId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    removeStaff: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                eventId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}

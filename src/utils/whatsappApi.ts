import type { SalonSettings } from '../context/SalonSettingsContext';

export interface WhatsAppMessagePayload {
    to: string;
    text?: string;
    mediaUrl?: string;       // Public URL for media (Meta or manual)
    mediaFile?: File;        // Local file from device (Meta API will upload first)
    mediaType?: 'image' | 'video' | 'document'; // type of media being sent
}

/**
 * Uploads a local file to Meta's media API and returns the media_id
 */
export const uploadMetaMedia = async (
    settings: SalonSettings,
    file: File
): Promise<{ mediaId?: string; error?: string }> => {
    const endpoint = `https://graph.facebook.com/v18.0/${settings.whatsappPhoneNumberId}/media`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type);
    formData.append('messaging_product', 'whatsapp');

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.whatsappAccessToken}`,
                // Note: Do NOT set Content-Type for FormData — browser does it automatically
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.error?.message || 'Media upload failed' };
        }

        return { mediaId: data.id };
    } catch (e: any) {
        return { error: e.message || 'Network error during media upload' };
    }
};

/**
 * Sends a WhatsApp message via the configured API Provider
 */
export const sendWhatsAppMessage = async (
    settings: SalonSettings,
    payload: WhatsAppMessagePayload
): Promise<{ success: boolean; error?: string }> => {
    
    if (settings.whatsappApiProvider === 'none') {
        return { success: false, error: 'WhatsApp API is not configured.' };
    }

    if (!settings.whatsappAccessToken || !settings.whatsappPhoneNumberId) {
        return { success: false, error: 'Missing API Token or Phone Number ID in settings.' };
    }

    const cleanNumber = payload.to.replace(/\D/g, '');

    try {
        if (settings.whatsappApiProvider === 'meta') {
            return await sendMetaMessage(settings, cleanNumber, payload);
        } else if (settings.whatsappApiProvider === 'twilio') {
            return await sendTwilioMessage(settings, cleanNumber, payload);
        }
        
        return { success: false, error: 'Unsupported provider' };
    } catch (error: any) {
        console.error("WhatsApp API Error:", error);
        return { success: false, error: error.message || 'Network error occurred' };
    }
};

const sendMetaMessage = async (settings: SalonSettings, to: string, payload: WhatsAppMessagePayload) => {
    const endpoint = `https://graph.facebook.com/v18.0/${settings.whatsappPhoneNumberId}/messages`;

    let mediaId: string | undefined;

    // If a local file is provided, upload it first to get a media_id
    if (payload.mediaFile) {
        const uploadResult = await uploadMetaMedia(settings, payload.mediaFile);
        if (uploadResult.error) {
            return { success: false, error: `Media upload failed: ${uploadResult.error}` };
        }
        mediaId = uploadResult.mediaId;
    }

    let body: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
    };

    // Determine media type
    const detectedType = payload.mediaType || (payload.mediaFile
        ? (payload.mediaFile.type.startsWith('video') ? 'video' : 'image')
        : (payload.mediaUrl?.match(/\.(mp4|mov|avi|mkv)$/i) ? 'video' : 'image'));

    if (mediaId) {
        // Use uploaded media_id
        body.type = detectedType;
        body[detectedType] = {
            id: mediaId,
            caption: payload.text || ""
        };
    } else if (payload.mediaUrl) {
        // Use public URL
        body.type = detectedType;
        body[detectedType] = {
            link: payload.mediaUrl,
            caption: payload.text || ""
        };
    } else {
        // Text only
        body.type = "text";
        body.text = { body: payload.text || "" };
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${settings.whatsappAccessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send Meta message');
    }

    return { success: true };
};

const sendTwilioMessage = async (_settings: SalonSettings, _to: string, _payload: WhatsAppMessagePayload) => {
    throw new Error("Twilio integration currently requires a backend proxy to prevent CORS issues. Please use Meta API or Manual mode.");
};

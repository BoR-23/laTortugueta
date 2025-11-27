import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: Request) {
    try {
        const { colorId, image } = await request.json();

        if (!colorId || !image) {
            return NextResponse.json({ error: 'Missing colorId or image' }, { status: 400 });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const key = `images/colors/color-${colorId}.png`;
        const url = await uploadToR2(buffer, key, 'image/png');

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error('Error uploading color image:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}

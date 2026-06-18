import { url } from './paths';

export const normalizeAuthorAvatar = (avatar?: string) => {
	if (!avatar) return avatar;
	const normalized = avatar.replace(/^\/?public\//, '/');
	return url(normalized);
};

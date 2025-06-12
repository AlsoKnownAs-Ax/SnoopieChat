import {
	ChatControllerApi,
	ContactControllerApi,
	HealthControllerApi,
	PkiControllerApi,
	UserControllerApi
} from '$lib/api';
import { apiAxiosInstance, configuration } from './sdk-setup';

//Alex: I think there is a better way to automate this but for
// 		now this works ( I spent too much time on this already XD)
export const HealthService = new HealthControllerApi(
	configuration,
	configuration.basePath,
	apiAxiosInstance
);

export const UserService = new UserControllerApi(
	configuration,
	configuration.basePath,
	apiAxiosInstance
);

export const ChatService = new ChatControllerApi(
	configuration,
	configuration.basePath,
	apiAxiosInstance
);

export const ContactService = new ContactControllerApi(
	configuration,
	configuration.basePath,
	apiAxiosInstance
);

export const PkiService = new PkiControllerApi(
	configuration,
	configuration.basePath,
	apiAxiosInstance
);

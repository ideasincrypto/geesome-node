import {IGeesomeApp, IUserInput} from "../../interface";
import {CorePermissionName, IInvite, IListParams} from "../database/interface";
import IGeesomeInviteModule from "./interface";
const pIteration = require('p-iteration');
const _ = require('lodash');
const ethereumAuthorization = require('geesome-libs/src/ethereum');
const geesomeMessages = require("geesome-libs/src/messages");
const commonHelpers = require("geesome-libs/src/common");

module.exports = async (app: IGeesomeApp) => {
	app.checkModules(['database', 'group']);

	const {sequelize, models} = app.ms.database;
	const module = getModule(app, await require('./models')(sequelize, models));
	require('./api')(app, module);
	return module;
}

function getModule(app: IGeesomeApp, models) {

	class InviteModule implements IGeesomeInviteModule {
		public async registerUserByInviteCode(inviteCode, userData: IUserInput): Promise<any> {
			userData = _.pick(userData, ['email', 'name', 'password', 'accounts']);

			const invite = await this.findInviteByCode(inviteCode);
			if (!invite) {
				throw new Error("invite_not_found");
			}
			if (!invite.isActive) {
				throw new Error("invite_not_active");
			}
			const joinedByInviteCount = await this.getJoinedByInviteCount(invite.id);
			if (joinedByInviteCount >= invite.maxCount) {
				throw new Error("invite_max_count");
			}

			if (userData.accounts) {
				const selfIpnsId = await app.ms.staticId.getSelfStaticAccountId();

				userData.accounts.forEach(acc => {
					if (acc.provider === 'ethereum') {
						if (!acc.signature) {
							throw new Error("signature_required");
						}
						const isValid = ethereumAuthorization.isSignatureValid(acc.address, acc.signature, geesomeMessages.acceptInvite(selfIpnsId, inviteCode), 'message');
						if (!isValid) {
							throw Error('account_signature_not_valid');
						}
					} else {
						throw Error('not_supported_provider');
					}
				});
			}

			const user = await app.registerUser({
				...userData,
				permissions: JSON.parse(invite.permissions),
			});

			await models.JoinedByPivot.create({
				userId: user.id,
				joinedByInviteId: invite.id,
				joinedByUserId: invite.createdById
			});

			if (invite.limits) {
				await pIteration.forEachSeries(JSON.parse(invite.limits), (limitData) => {
					return app.setUserLimit(invite.createdById, {
						...limitData,
						userId: user.id,
					});
				});
			}

			if (invite.groupsToJoin) {
				await pIteration.forEachSeries(JSON.parse(invite.groupsToJoin), (groupId) => {
					return app.ms.group.addMemberToGroup(invite.createdById, groupId, user.id).catch(e => {/*ignore, because it's optional*/});
				});
			}

			return { user, apiKey: await app.generateUserApiKey(user.id, {type: "invite"})};
		}

		async createInvite(userId, inviteData) {
			await app.checkUserCan(userId, CorePermissionName.AdminAddUser);
			inviteData.code = commonHelpers.makeCode(16);
			inviteData.createdById = userId;
			return this.addInvite(inviteData);
		}

		async updateInvite(userId, inviteId, inviteData) {
			await app.checkUserCan(userId, CorePermissionName.AdminAddUser);
			const invite = await this.getInvite(inviteId);
			if (!invite) {
				throw new Error("not_found");
			}
			if (invite.createdById !== userId) {
				throw new Error("not_creator");
			}
			delete inviteData.code;
			delete inviteData.createdById;
			return models.Invite.update(inviteData, {where: {id: inviteId}})
		}

		async getUserInvites(userId, filters = {}, listParams?: IListParams) {
			listParams = this.prepareListParams(listParams);

			app.ms.database.setDefaultListParamsValues(listParams, {sortBy: 'createdAt'});

			const {limit, offset, sortBy, sortDir} = listParams;
			const where = { createdById: userId };
			if (!_.isUndefined(filters['isActive'])) {
				where['isActive'] = _.isUndefined(filters['isActive']);
			}
			return {
				list: await models.Invite.findAll({
					where,
					order: [[sortBy, sortDir.toUpperCase()]],
					limit,
					offset
				}),
				total: await this.getUserInvitesCount(userId, filters)
			};
		}

		async addInvite(invite) {
			return models.Invite.create(invite);
		}

		async getInvite(id) {
			return models.Invite.findOne({where: {id}}) as IInvite;
		}

		async findInviteByCode(code) {
			return models.Invite.findOne({where: {code}}) as IInvite;
		}

		async getJoinedByInviteCount(joinedByInviteId) {
			return models.JoinedByPivot.count({ where: {joinedByInviteId} });
		}

		async getInvitedUserOfJoinedUser(userId) {
			return (await app.ms.database.getUser(userId) as any).getJoinedByUser().then(res => res[0]);
		}

		async getInviteOfJoinedUser(userId) {
			return (await app.ms.database.getUser(userId) as any).getJoinedByInvite().then(res => res[0]);
		}

		async getUsersListJoinedByInvite(inviteId) {
			return (await this.getInvite(inviteId) as any).getUsersJoinedByInvite();
		}

		async getUsersListJoinedByUser(userId) {
			return (await app.ms.database.getUser(userId) as any).getUsersJoinedByUser();
		}

		async getUserInvitesCount(createdById, filters = {}) {
			const where = { createdById };
			if (!_.isUndefined(filters['isActive'])) {
				where['isActive'] = _.isUndefined(filters['isActive']);
			}
			return models.Invite.findAll({ where });
		}

		async getAllInvites(filters = {}, listParams: IListParams = {}) {
			app.ms.database.setDefaultListParamsValues(listParams, {sortBy: 'createdAt'});

			const {limit, offset, sortBy, sortDir} = listParams;
			const where = { };
			if (!_.isUndefined(filters['isActive'])) {
				where['isActive'] = _.isUndefined(filters['isActive']);
			}
			return models.Invite.findAll({
				where,
				order: [[sortBy, sortDir.toUpperCase()]],
				limit,
				offset
			});
		}

		async flushDatabase() {
			await pIteration.forEachSeries(['JoinedByPivot', 'Invite'], (modelName) => {
				return models[modelName].destroy({where: {}});
			});
		}

		prepareListParams(listParams?: IListParams): IListParams {
			return _.pick(listParams, ['sortBy', 'sortDir', 'limit', 'offset']);
		}
	}
	return new InviteModule();
}
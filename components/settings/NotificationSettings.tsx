import React from 'react';
import SelectField from '../common/SelectField';
import SecretField from '../common/SecretField';
import InputField from '../common/InputField';
import { useLanguage } from '../../context/LanguageContext';

type NotificationSettingsProps = {
   settings: SettingsType,
   settingsError: null | {
      type: string,
      msg: string
   },
   updateSettings: Function,
}

const NotificationSettings = ({ settings, settingsError, updateSettings }: NotificationSettingsProps) => {
   const { t } = useLanguage();
   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';

   return (
      <div>
         <div className='settings__content styled-scrollbar p-6 text-sm'>
            <div className="settings__section__input mb-5">
               <SelectField
                  label={t('notificationSettings.frequency')}
                  multiple={false}
                  selected={[settings.notification_interval]}
                  options={[
                     { label: t('notificationSettings.freqDaily'), value: 'daily' },
                     { label: t('notificationSettings.freqWeekly'), value: 'weekly' },
                     { label: t('notificationSettings.freqMonthly'), value: 'monthly' },
                     { label: t('notificationSettings.freqNever'), value: 'never' },
                  ]}
                  defaultLabel={t('notificationSettings.settingsLabel')}
                  updateField={(updated: string[]) => updated[0] && updateSettings('notification_interval', updated[0])}
                  rounded='rounded'
                  maxHeight={48}
                  minWidth={220}
               />
            </div>
            {settings.notification_interval !== 'never' && (
               <>
                  <div className="settings__section__input mb-5">
                     <InputField
                        label={t('notificationSettings.emails')}
                        hasError={settingsError?.type === 'no_email'}
                        value={settings?.notification_email}
                        placeholder={t('notificationSettings.emailsPlaceholder')}
                        onChange={(value: string) => updateSettings('notification_email', value)}
                     />
                  </div>

                  {settings.smtp_from_env && (
                     <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                        <strong>{t('notificationSettings.smtpConfigTitle')}</strong> {t('notificationSettings.smtpConfigDesc')}
                     </div>
                  )}

                  <div className="settings__section__input mb-5">
                     <InputField
                        label={t('notificationSettings.smtpServer')}
                        hasError={settingsError?.type === 'no_smtp_server'}
                        value={settings?.smtp_server || ''}
                        placeholder={t('notificationSettings.smtpServerPlaceholder')}
                        onChange={(value: string) => updateSettings('smtp_server', value)}
                        disabled={settings.smtp_from_env}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <InputField
                        label={t('notificationSettings.smtpPort')}
                        hasError={settingsError?.type === 'no_smtp_port'}
                        value={settings?.smtp_port || ''}
                        placeholder={t('notificationSettings.smtpPortPlaceholder')}
                        onChange={(value: string) => updateSettings('smtp_port', value)}
                        disabled={settings.smtp_from_env}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <InputField
                        label={t('notificationSettings.smtpUser')}
                        hasError={settingsError?.type === 'no_smtp_port'}
                        value={settings?.smtp_username || ''}
                        placeholder={t('notificationSettings.smtpUserPlaceholder')}
                        onChange={(value: string) => updateSettings('smtp_username', value)}
                        disabled={settings.smtp_from_env}
                     />
                  </div>
                  {!settings.smtp_from_env && (
                     <div className="settings__section__input mb-5">
                        <SecretField
                           label={t('notificationSettings.smtpPass')}
                           value={settings?.smtp_password || ''}
                           onChange={(value: string) => updateSettings('smtp_password', value)}
                        />
                     </div>
                  )}
                  <div className="settings__section__input mb-5">
                     <InputField
                        label={t('notificationSettings.fromEmail')}
                        hasError={settingsError?.type === 'no_smtp_from'}
                        value={settings?.notification_email_from || ''}
                        placeholder={t('notificationSettings.fromEmailPlaceholder')}
                        onChange={(value: string) => updateSettings('notification_email_from', value)}
                        disabled={settings.smtp_from_env}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <InputField
                        label={t('notificationSettings.fromName')}
                        hasError={settingsError?.type === 'no_smtp_from'}
                        value={settings?.notification_email_from_name || 'SEO Ai Agent'}
                        placeholder={t('notificationSettings.fromNamePlaceholder')}
                        onChange={(value: string) => updateSettings('notification_email_from_name', value)}
                        disabled={settings.smtp_from_env}
                     />
                  </div>
               </>
            )}

         </div>
         {settingsError?.msg && (
            <div className='absolute w-full bottom-16  text-center p-3 bg-red-100 text-red-600 text-sm font-semibold'>
               {settingsError.msg}
            </div>
         )}
      </div>
   );
};

export default NotificationSettings;

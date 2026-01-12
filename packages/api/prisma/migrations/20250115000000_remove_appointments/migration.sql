-- DropForeignKey
ALTER TABLE "crm_appointment_collaborators" DROP CONSTRAINT IF EXISTS "crm_appointment_collaborators_appointment_id_fkey";
ALTER TABLE "crm_appointment_collaborators" DROP CONSTRAINT IF EXISTS "crm_appointment_collaborators_user_id_fkey";
ALTER TABLE "crm_appointments" DROP CONSTRAINT IF EXISTS "crm_appointments_tenant_id_fkey";
ALTER TABLE "crm_appointments" DROP CONSTRAINT IF EXISTS "crm_appointments_contact_id_fkey";
ALTER TABLE "crm_appointments" DROP CONSTRAINT IF EXISTS "crm_appointments_deal_id_fkey";
ALTER TABLE "crm_appointments" DROP CONSTRAINT IF EXISTS "crm_appointments_created_by_user_id_fkey";
ALTER TABLE "crm_appointments" DROP CONSTRAINT IF EXISTS "crm_appointments_assigned_to_user_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "crm_appointment_collaborators";
DROP TABLE IF EXISTS "crm_appointments";

-- DropEnum
DROP TYPE IF EXISTS "CrmAppointmentStatus";
DROP TYPE IF EXISTS "CrmAppointmentType";


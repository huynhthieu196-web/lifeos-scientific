
-- Strict ownership on new/empty personal tables.
ALTER TABLE public."Item" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE public."Project" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE public."Review" ALTER COLUMN "ownerId" SET NOT NULL;

-- Each account gets its own independent Tag namespace.
ALTER TABLE public."Tag" ADD COLUMN "ownerId" text NOT NULL;
ALTER TABLE public."Tag" ADD CONSTRAINT "Tag_ownerId_fkey"
 FOREIGN KEY ("ownerId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
DROP INDEX IF EXISTS public."Tag_name_key";
CREATE UNIQUE INDEX "Tag_ownerId_name_key" ON public."Tag"("ownerId","name");
CREATE INDEX "Tag_ownerId_idx" ON public."Tag"("ownerId");

-- Enforce cross-owner references at the DB boundary as defense in depth.
CREATE FUNCTION public.lifeos_check_item_project_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $func$
BEGIN
 IF NEW."projectId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public."Project" p
    WHERE p.id = NEW."projectId" AND p."ownerId" = NEW."ownerId"
 ) THEN
   RAISE EXCEPTION 'Item cannot reference another account project' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END
$func$;
CREATE TRIGGER lifeos_item_project_owner
 BEFORE INSERT OR UPDATE OF "ownerId", "projectId" ON public."Item"
 FOR EACH ROW EXECUTE FUNCTION public.lifeos_check_item_project_owner();

CREATE FUNCTION public.lifeos_check_link_same_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $func$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM public."Item" a JOIN public."Item" b
     ON a."ownerId"=b."ownerId"
   WHERE a.id=NEW."fromId" AND b.id=NEW."toId"
 ) THEN
   RAISE EXCEPTION 'Link cannot join accounts' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END
$func$;
CREATE TRIGGER lifeos_link_same_owner
 BEFORE INSERT OR UPDATE OF "fromId","toId" ON public."Link"
 FOR EACH ROW EXECUTE FUNCTION public.lifeos_check_link_same_owner();

CREATE FUNCTION public.lifeos_check_review_item_same_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $func$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM public."Review" r JOIN public."Item" i
    ON r."ownerId"=i."ownerId"
   WHERE r.id=NEW."reviewId" AND i.id=NEW."itemId"
 ) THEN
  RAISE EXCEPTION 'Review cannot contain another account item' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END
$func$;
CREATE TRIGGER lifeos_review_item_same_owner
 BEFORE INSERT OR UPDATE OF "reviewId","itemId" ON public."ReviewItem"
 FOR EACH ROW EXECUTE FUNCTION public.lifeos_check_review_item_same_owner();

CREATE FUNCTION public.lifeos_check_tag_item_same_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $func$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM public."Tag" t JOIN public."Item" i
    ON t."ownerId"=i."ownerId"
   WHERE t.id=NEW."tagId" AND i.id=NEW."itemId"
 ) THEN
  RAISE EXCEPTION 'Tag cannot be shared across accounts' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END
$func$;
CREATE TRIGGER lifeos_tag_item_same_owner
 BEFORE INSERT OR UPDATE OF "tagId","itemId" ON public."TagOnItem"
 FOR EACH ROW EXECUTE FUNCTION public.lifeos_check_tag_item_same_owner();

-- No trigger function is a public API.
REVOKE ALL ON FUNCTION public.lifeos_check_item_project_owner() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lifeos_check_link_same_owner() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lifeos_check_review_item_same_owner() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lifeos_check_tag_item_same_owner() FROM PUBLIC, anon, authenticated;

import { modelOptions, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

/**
 * config Model
 */
@modelOptions({
  schemaOptions: { collection: "configs" },
})
export class Config extends TimeStamps {
  @prop({ required: true, unique: true })
  public key!: string;

  @prop()
  public content!: string;
}

export default Config;

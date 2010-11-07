class MsgThread < ActiveRecord::Base
    has_many :posts
    has_one :first_post, :class_name => "Post", :conditions => "post_index = 0"
    belongs_to :user
    belongs_to :folder
    validates :title, :presence => true

    before_destroy do |thread|
        Post.destroy_all "msg_thread_id = #{thread.id}"
    end
end
